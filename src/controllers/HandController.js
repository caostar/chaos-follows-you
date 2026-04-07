/**
 * HandController — Drives visual chaos from hand tracking via MediaPipe.
 *
 * Uses MediaPipe HandLandmarker (WASM) for real-time hand detection.
 * Gesture mapping:
 *   - Index finger tip → move emitter
 *   - Pinch (thumb + index close) → new chaos star
 *   - Open hand (all fingers extended) → zoom in
 *   - Fist (all fingers curled) → zoom out
 *
 * Toggle with 'h' key. Optional debug video overlay with 'd' key.
 */
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const DEFAULT_CONFIG = {
  // Detection runs every N ms (lower = smoother but more CPU)
  detectionInterval: 66, // ~15fps
  // Minimum confidence to accept a detection
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  // Pinch threshold: distance between thumb tip and index tip (normalized 0-1)
  pinchThreshold: 0.06,
  // Cooldowns (ms)
  pinchCooldown: 500,
  gestureCooldown: 800,
  // Zoom
  zoomFactor: 1.3,
  zoomDuration: 2.0,
  // Movement smoothing (0 = no smoothing, 1 = frozen)
  smoothing: 0.3,
  // Debug overlay
  showDebugVideo: false,
};

// Landmark indices (MediaPipe hand model)
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;
const WRIST = 0;

export default class HandController {
  constructor(play) {
    this.play = play;
    this.active = false;
    this.config = { ...DEFAULT_CONFIG };

    this._handLandmarker = null;
    this._video = null;
    this._stream = null;
    this._animFrame = null;
    this._lastDetectionTime = 0;
    this._lastPinchTime = 0;
    this._lastGestureTime = 0;
    this._lastGesture = null;
    this._smoothX = null;
    this._smoothY = null;
    this._debugCanvas = null;
    this._debugCtx = null;
    this._debugVisible = false;
  }

  /**
   * Load optional config from /handControls.json.
   */
  async loadConfig() {
    try {
      const resp = await fetch('/handControls.json');
      if (resp.ok) {
        const json = await resp.json();
        Object.assign(this.config, json);
      }
    } catch {
      // Use defaults
    }
    return this.config;
  }

  async start() {
    if (this.active) return;

    console.log('[HandMode] Starting...');

    try {
      // Initialize MediaPipe HandLandmarker if needed
      if (!this._handLandmarker) {
        await this._initModel();
      }

      // Request camera
      if (!this._video) {
        await this._initCamera();
      }

      this.active = true;
      this._smoothX = null;
      this._smoothY = null;
      this._lastDetectionTime = 0;
      this._runDetection();

      console.log('[HandMode] Active — tracking hands');
    } catch (err) {
      console.error('[HandMode] Failed to start:', err);
      this.stop();
      throw err;
    }
  }

  stop() {
    if (!this.active) return;

    this.active = false;

    if (this._detectionTimer) {
      clearTimeout(this._detectionTimer);
      this._detectionTimer = null;
    }
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }

    console.log('[HandMode] Stopped');
  }

  destroy() {
    this.stop();

    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }

    if (this._video) {
      this._video.remove();
      this._video = null;
    }

    if (this._debugCanvas) {
      this._debugCanvas.remove();
      this._debugCanvas = null;
    }

    if (this._handLandmarker) {
      this._handLandmarker.close();
      this._handLandmarker = null;
    }
  }

  toggleDebug() {
    this._debugVisible = !this._debugVisible;
    if (this._debugVisible) {
      this._showDebugOverlay();
    } else {
      this._hideDebugOverlay();
    }
    console.log(`[HandMode] Debug overlay ${this._debugVisible ? 'shown' : 'hidden'}`);
  }

  _showDebugOverlay() {
    if (this._video) {
      this._video.style.cssText = `
        position: fixed; bottom: 8px; left: 8px; width: 160px; height: 120px;
        border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
        z-index: 10001; transform: scaleX(-1); opacity: 0.7;
      `;
    }
    if (this._debugCanvas) {
      this._debugCanvas.style.display = 'block';
    }
  }

  _hideDebugOverlay() {
    if (this._video) {
      this._video.style.cssText = `
        position: fixed; bottom: 8px; left: 8px;
        width: 1px; height: 1px; opacity: 0;
        pointer-events: none; z-index: -1;
      `;
    }
    if (this._debugCanvas) {
      this._debugCanvas.style.display = 'none';
    }
  }

  // --- Private: Initialization ---

  async _initModel() {
    console.log('[HandMode] Loading MediaPipe HandLandmarker model...');

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );

    this._handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: this.config.minDetectionConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
    });

    console.log('[HandMode] Model loaded');
  }

  async _initCamera() {
    this._stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 240 },
      audio: false,
    });

    this._video = document.createElement('video');
    this._video.id = 'hand-tracking-video';
    this._video.srcObject = this._stream;
    this._video.autoplay = true;
    this._video.playsInline = true;
    this._video.muted = true;
    // IMPORTANT: Do NOT use display:none — browsers pause/throttle hidden video
    // decoding, which breaks MediaPipe detection. Instead use a tiny off-screen
    // element that gets repositioned when debug mode is toggled on.
    this._video.style.cssText = `
      position: fixed; bottom: 8px; left: 8px;
      width: 1px; height: 1px; opacity: 0;
      pointer-events: none; z-index: -1;
    `;
    document.body.appendChild(this._video);

    // Debug canvas for drawing landmarks
    this._debugCanvas = document.createElement('canvas');
    this._debugCanvas.id = 'hand-tracking-debug';
    this._debugCanvas.width = 320;
    this._debugCanvas.height = 240;
    this._debugCanvas.style.cssText = `
      position: fixed; bottom: 8px; left: 8px; width: 160px; height: 120px;
      border-radius: 8px; z-index: 10002; display: none; transform: scaleX(-1);
      pointer-events: none;
    `;
    document.body.appendChild(this._debugCanvas);
    this._debugCtx = this._debugCanvas.getContext('2d');

    // Wait for video to be ready
    await new Promise((resolve) => {
      this._video.addEventListener('loadeddata', resolve, { once: true });
    });

    if (this.config.showDebugVideo) {
      this._debugVisible = true;
      this._showDebugOverlay();
    }

    console.log('[HandMode] Camera ready');
  }

  // --- Private: Detection loop ---

  _runDetection() {
    if (!this.active) return;

    const now = performance.now();

    if (this._video && this._video.readyState >= 2) {
      try {
        const results = this._handLandmarker.detectForVideo(this._video, now);
        this._processResults(results, now);
      } catch (err) {
        console.warn('[HandMode] Detection error:', err.message);
      }
    }

    // Use setTimeout at detection interval instead of rAF (which fires at 60fps
    // but we only detect at ~15fps, wasting CPU on empty rAF ticks)
    this._detectionTimer = setTimeout(() => this._runDetection(), this.config.detectionInterval);
  }

  _processResults(results, now) {
    // Draw debug overlay
    if (this._debugVisible && this._debugCtx) {
      this._drawDebug(results);
    }

    if (!results.landmarks || results.landmarks.length === 0) return;

    const landmarks = results.landmarks[0]; // First hand

    // 1. Move emitter to index finger tip
    this._trackFinger(landmarks);

    // 2. Check for pinch (thumb + index)
    if (now - this._lastPinchTime > this.config.pinchCooldown) {
      if (this._isPinching(landmarks)) {
        this._lastPinchTime = now;
        this.play.newChaos(this.play);
        console.log('[HandMode] Pinch → new shape');
      }
    }

    // 3. Check for open hand / fist (zoom gestures)
    if (now - this._lastGestureTime > this.config.gestureCooldown) {
      const gesture = this._detectGesture(landmarks);
      if (gesture && gesture !== this._lastGesture) {
        this._lastGestureTime = now;
        this._lastGesture = gesture;

        if (gesture === 'open') {
          this._zoomGesture('in');
          console.log('[HandMode] Open hand → zoom in');
        } else if (gesture === 'fist') {
          this._zoomGesture('out');
          console.log('[HandMode] Fist → zoom out');
        }
      } else if (!gesture) {
        this._lastGesture = null;
      }
    }
  }

  // --- Private: Finger tracking ---

  _trackFinger(landmarks) {
    const indexTip = landmarks[INDEX_TIP];

    // MediaPipe coordinates: x is 0-1 (left to right in video, but mirrored)
    // y is 0-1 (top to bottom)
    // We mirror x since the video is flipped
    const normX = 1 - indexTip.x;
    const normY = indexTip.y;

    // Map to viewport world coordinates
    const screenX = normX * window.innerWidth;
    const screenY = normY * window.innerHeight;
    const worldX = (screenX - (window.viewport?.lastViewport?.x || 0)) / (window.viewport?.lastViewport?.scaleX || 1);
    const worldY = (screenY - (window.viewport?.lastViewport?.y || 0)) / (window.viewport?.lastViewport?.scaleY || 1);

    // Apply smoothing
    if (this._smoothX === null) {
      this._smoothX = worldX;
      this._smoothY = worldY;
    } else {
      const s = this.config.smoothing;
      this._smoothX = this._smoothX * s + worldX * (1 - s);
      this._smoothY = this._smoothY * s + worldY * (1 - s);
    }

    this.play.moveEmitter(this._smoothX, this._smoothY, 0.15, 'none');
  }

  // --- Private: Gesture detection ---

  _isPinching(landmarks) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    const dist = this._distance(thumbTip, indexTip);
    return dist < this.config.pinchThreshold;
  }

  /**
   * Detect open hand vs fist by checking if fingertips are above their MCP joints.
   * Returns 'open', 'fist', or null (ambiguous).
   */
  _detectGesture(landmarks) {
    const fingers = [
      { tip: INDEX_TIP, mcp: INDEX_MCP },
      { tip: MIDDLE_TIP, mcp: MIDDLE_MCP },
      { tip: RING_TIP, mcp: RING_MCP },
      { tip: PINKY_TIP, mcp: PINKY_MCP },
    ];

    let extended = 0;
    let curled = 0;

    for (const { tip, mcp } of fingers) {
      // In MediaPipe, y increases downward. A finger is extended if its
      // tip is higher (lower y) than its MCP joint, relative to the wrist.
      const tipY = landmarks[tip].y;
      const mcpY = landmarks[mcp].y;

      if (tipY < mcpY - 0.02) {
        extended++;
      } else if (tipY > mcpY + 0.02) {
        curled++;
      }
    }

    if (extended >= 4) return 'open';
    if (curled >= 4) return 'fist';
    return null;
  }

  _zoomGesture(direction) {
    const currentScale = window.viewport?.lastViewport?.scaleX || 1;
    const factor = this.config.zoomFactor;

    let targetScale;
    if (direction === 'in') {
      targetScale = currentScale * factor;
    } else {
      targetScale = currentScale / factor;
    }

    const spawnX = this.play.emitter.spawnPos.x;
    const spawnY = this.play.emitter.spawnPos.y;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const viewX = cx - spawnX * targetScale;
    const viewY = cy - spawnY * targetScale;

    this.play.goZoom(viewX, viewY, targetScale, this.config.zoomDuration);
  }

  // --- Private: Helpers ---

  _distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  _drawDebug(results) {
    const ctx = this._debugCtx;
    const w = this._debugCanvas.width;
    const h = this._debugCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!results.landmarks || results.landmarks.length === 0) return;

    // MediaPipe hand skeleton: each connection is {start, end}
    // Define manually since HAND_CONNECTIONS format varies across versions
    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],       // thumb
      [0,5],[5,6],[6,7],[7,8],       // index
      [0,9],[9,10],[10,11],[11,12],  // middle
      [0,13],[13,14],[14,15],[15,16],// ring
      [0,17],[17,18],[18,19],[19,20],// pinky
      [5,9],[9,13],[13,17],          // palm
    ];

    for (const landmarks of results.landmarks) {
      // Draw connections
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)';
      ctx.lineWidth = 1;
      for (const [start, end] of CONNECTIONS) {
        if (landmarks[start] && landmarks[end]) {
          ctx.beginPath();
          ctx.moveTo(landmarks[start].x * w, landmarks[start].y * h);
          ctx.lineTo(landmarks[end].x * w, landmarks[end].y * h);
          ctx.stroke();
        }
      }

      // Draw landmarks
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 2, 0, 2 * Math.PI);
        ctx.fillStyle = i === INDEX_TIP ? '#e040fb' : '#4fc3f7';
        ctx.fill();
      }
    }
  }
}
