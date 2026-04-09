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
  // "Zoom sculptor" preset — sensitive detection, responsive zoom
  detectionInterval: 50,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  pinchThreshold: 0.07,
  pinchCooldown: 200,
  // Two-hand zoom: triggers a smooth random zoom in the detected direction
  twoHandZoomThreshold: 0.02,
  twoHandZoomCooldown: 800,       // ms between zoom gestures
  twoHandZoomRange: { min: 1.3, max: 2.5 }, // random zoom factor range
  twoHandZoomDuration: { min: 1.5, max: 3.0 }, // smooth animation duration
  // Movement smoothing (0 = no smoothing, 1 = frozen)
  smoothing: 0.3,
  // Debug overlay
  showDebugVideo: false,
  debugAlpha: 0.2,
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
    this._debugExpanded = false;
    this._expandBtn = null;
    // Two-hand zoom tracking
    this._prevHandDist = null;
    this._lastZoomTime = 0;
  }

  /**
   * Load optional config from /handControls.json.
   */
  async loadConfig() {
    try {
      const resp = await fetch(`${import.meta.env.BASE_URL}handControls.json`);
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
      this._prevHandDist = null;
      this._lastZoomTime = 0;
      this._runDetection();

      // Auto-enable debug video in expanded (fullscreen) mode
      this._debugVisible = true;
      this._debugExpanded = true;
      this._showDebugOverlay();
      if (this._expandBtn) {
        this._expandBtn.textContent = '⊖';
        this._updateExpandBtnPosition();
      }

      console.log('[HandMode] Active — tracking hands (debug fullscreen)');
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

    // Hide debug overlay when stopping
    if (this._debugVisible) {
      this._debugVisible = false;
      this._debugExpanded = false;
      this._hideDebugOverlay();
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

    if (this._expandBtn) {
      this._expandBtn.remove();
      this._expandBtn = null;
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

  toggleDebugExpand() {
    this._debugExpanded = !this._debugExpanded;
    if (this._debugVisible) {
      this._applyDebugLayout();
    }
    if (this._expandBtn) {
      this._expandBtn.textContent = this._debugExpanded ? '⊖' : '⊕';
      this._updateExpandBtnPosition();
    }
    console.log(`[HandMode] Debug ${this._debugExpanded ? 'expanded' : 'collapsed'}`);
  }

  _showDebugOverlay() {
    this._applyDebugLayout();
    if (this._debugCanvas) {
      this._debugCanvas.style.display = 'block';
    }
    if (!this._expandBtn) {
      this._createExpandBtn();
    }
    this._expandBtn.style.display = 'block';
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
    if (this._expandBtn) {
      this._expandBtn.style.display = 'none';
    }
  }

  _applyDebugLayout() {
    const expandedAlpha = this.config.debugAlpha ?? 0.2;

    if (this._debugExpanded) {
      // Fullscreen — behind everything (stars + controls on top)
      if (this._video) {
        this._video.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          z-index: 1; transform: scaleX(-1); opacity: ${expandedAlpha};
          object-fit: cover;
        `;
      }
      if (this._debugCanvas) {
        this._debugCanvas.width = window.innerWidth;
        this._debugCanvas.height = window.innerHeight;
        this._debugCanvas.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          z-index: 2; transform: scaleX(-1);
          pointer-events: none; opacity: 1;
        `;
      }
    } else {
      // Small corner — full opacity so the preview is clearly visible
      if (this._video) {
        this._video.style.cssText = `
          position: fixed; bottom: 8px; left: 8px; width: 160px; height: 120px;
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
          z-index: 1; transform: scaleX(-1); opacity: 0.7;
        `;
      }
      if (this._debugCanvas) {
        this._debugCanvas.width = 320;
        this._debugCanvas.height = 240;
        this._debugCanvas.style.cssText = `
          position: fixed; bottom: 8px; left: 8px; width: 160px; height: 120px;
          border-radius: 8px; z-index: 2; transform: scaleX(-1);
          pointer-events: none; opacity: 1;
        `;
      }
    }
  }

  _createExpandBtn() {
    this._expandBtn = document.createElement('button');
    this._expandBtn.id = 'hand-debug-expand';
    this._expandBtn.textContent = '⊕';
    this._expandBtn.style.cssText = `
      position: fixed; bottom: 100px; left: 136px;
      width: 28px; height: 28px;
      background: rgba(0,0,0,0.7); color: #eee;
      border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
      font-size: 16px; cursor: pointer; z-index: 3;
      display: flex; align-items: center; justify-content: center;
      padding: 0; line-height: 1;
      transition: background 0.15s;
    `;
    this._expandBtn.addEventListener('click', () => this.toggleDebugExpand());
    // Reposition when expanded
    this._updateExpandBtnPosition();
    document.body.appendChild(this._expandBtn);
  }

  _updateExpandBtnPosition() {
    if (!this._expandBtn) return;
    if (this._debugExpanded) {
      this._expandBtn.style.top = '8px';
      this._expandBtn.style.right = '8px';
      this._expandBtn.style.bottom = 'auto';
      this._expandBtn.style.left = 'auto';
    } else {
      this._expandBtn.style.top = 'auto';
      this._expandBtn.style.right = 'auto';
      this._expandBtn.style.bottom = '100px';
      this._expandBtn.style.left = '136px';
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
      numHands: 2,
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

    // Keep debug video alpha in sync with config (for live controls editing)
    if (this._debugVisible && this._video) {
      const alpha = this._debugExpanded ? (this.config.debugAlpha ?? 0.2) : 0.7;
      this._video.style.opacity = alpha;
    }

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

    if (!results.landmarks || results.landmarks.length === 0) {
      this._prevHandDist = null;
      return;
    }

    const numHands = results.landmarks.length;

    if (numHands === 1) {
      const landmarks = results.landmarks[0];
      this._prevHandDist = null; // Reset two-hand tracking

      // Single hand: index finger moves emitter
      this._trackFinger(landmarks);

      // Single hand: pinch triggers new shape
      if (now - this._lastPinchTime > this.config.pinchCooldown) {
        if (this._isPinching(landmarks)) {
          this._lastPinchTime = now;
          this.play.newChaos(this.play);
          console.log('[HandMode] Pinch → new shape');
        }
      }

      this._lastGesture = 'point';
    } else if (numHands === 2) {
      // Two hands: use the right hand (or first detected) for emitter
      this._trackFinger(results.landmarks[0]);

      // Two hands: check pinch on either hand
      if (now - this._lastPinchTime > this.config.pinchCooldown) {
        for (const landmarks of results.landmarks) {
          if (this._isPinching(landmarks)) {
            this._lastPinchTime = now;
            this.play.newChaos(this.play);
            console.log('[HandMode] Pinch → new shape');
            break;
          }
        }
      }

      // Two hands: distance between hands controls zoom
      this._handleTwoHandZoom(results.landmarks[0], results.landmarks[1], now);

      this._lastGesture = 'two-hands';
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

    // Use a tween duration slightly longer than the detection interval
    // so GSAP smoothly interpolates between positions instead of jumping
    const tweenDuration = (this.config.detectionInterval / 1000) * 1.5;
    this.play.moveEmitter(this._smoothX, this._smoothY, tweenDuration, 'power2.out');
  }

  // --- Private: Gesture detection ---

  _isPinching(landmarks) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    const dist = this._distance(thumbTip, indexTip);
    return dist < this.config.pinchThreshold;
  }

  /**
   * Two-hand zoom: detect whether hands are spreading apart or coming together,
   * then fire a single smooth random zoom in that direction.
   * Instead of tracking frame-by-frame deltas (which causes jitter/blinking),
   * we detect the direction once, trigger a smooth GSAP-animated zoom,
   * and then go on cooldown.
   */
  _handleTwoHandZoom(hand1, hand2, now) {
    const wrist1 = hand1[WRIST];
    const wrist2 = hand2[WRIST];
    const currentDist = this._distance2D(wrist1, wrist2);

    if (this._prevHandDist === null) {
      this._prevHandDist = currentDist;
      return;
    }

    const delta = currentDist - this._prevHandDist;
    this._prevHandDist = currentDist;

    const threshold = this.config.twoHandZoomThreshold ?? 0.02;
    const cooldown = this.config.twoHandZoomCooldown ?? 800;

    // Only trigger if movement exceeds threshold AND we're off cooldown
    if (Math.abs(delta) > threshold && now - this._lastZoomTime > cooldown) {
      const direction = delta > 0 ? 'in' : 'out';
      this._smoothZoomGesture(direction);
      this._lastZoomTime = now;
    }
  }

  /**
   * Fire a smooth, slightly randomized zoom in the given direction.
   * Uses the same goZoom path as keyboard Z/X for consistency.
   */
  _smoothZoomGesture(direction) {
    const currentScale = window.viewport?.lastViewport?.scaleX || 1;
    const range = this.config.twoHandZoomRange ?? { min: 1.3, max: 2.5 };
    const durRange = this.config.twoHandZoomDuration ?? { min: 1.5, max: 3.0 };

    const factor = range.min + Math.random() * (range.max - range.min);
    const duration = durRange.min + Math.random() * (durRange.max - durRange.min);

    let targetScale;
    if (direction === 'in') {
      targetScale = currentScale * factor;
    } else {
      targetScale = currentScale / factor;
    }

    // Random position near the emitter for organic feel
    const spawnX = this.play.emitter.spawnPos.x;
    const spawnY = this.play.emitter.spawnPos.y;
    const cx = window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.3;
    const cy = window.innerHeight / 2 + (Math.random() - 0.5) * window.innerHeight * 0.3;

    const viewX = cx - spawnX * targetScale;
    const viewY = cy - spawnY * targetScale;

    this.play.newChaos(this.play);
    this.play.goZoom(viewX, viewY, targetScale, duration);
    console.log(`[HandMode] Two-hand ${direction} → zoom ${targetScale.toFixed(2)} over ${duration.toFixed(1)}s`);
  }

  // --- Private: Helpers ---

  _distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /** 2D distance (ignoring depth) — better for hand spread measurement */
  _distance2D(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
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
