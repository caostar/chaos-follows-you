# Hand Tracking Guide

The file `public/handControls.json` controls hand tracking behavior. Edit it and refresh — no rebuild needed.

**Toggle the hand panel**: Press `h` to show/hide the floating hand control panel.
**Toggle debug video**: Press `d` (while tracking is active) to see the camera feed with landmark overlay.

---

## Gestures

| Gesture | Action | Description |
|---------|--------|-------------|
| ☝️ Point (index finger) | Move emitter | The emitter follows your index fingertip in real-time |
| 🤏 Pinch (thumb + index) | New chaos star | Bring thumb and index together to generate a new star design |
| 🖐️ Open hand | Zoom in | Extend all 4 fingers to zoom the camera in |
| ✊ Fist | Zoom out | Curl all 4 fingers to zoom the camera out |

---

## Parameters Reference

### Detection

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `detectionInterval` | number (ms) | `66` | How often to run hand detection (~15fps). Lower = smoother tracking but more CPU. Try `33` for 30fps if your machine handles it. |
| `minDetectionConfidence` | number | `0.5` | Minimum confidence to accept a hand detection (0-1). Higher = fewer false positives but may lose tracking. |
| `minTrackingConfidence` | number | `0.5` | Minimum confidence to maintain tracking between frames. |

### Gestures

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pinchThreshold` | number | `0.06` | Distance (normalized 0-1) between thumb tip and index tip to trigger a pinch. Lower = need to pinch tighter. Higher = more forgiving. |
| `pinchCooldown` | number (ms) | `500` | Minimum time between pinch triggers. Prevents rapid-fire shape changes from holding a pinch. |
| `gestureCooldown` | number (ms) | `800` | Minimum time between zoom gestures (open hand / fist). |

### Zoom

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `zoomFactor` | number | `1.3` | How much each zoom gesture zooms (multiplier). Higher = more dramatic zoom per gesture. |
| `zoomDuration` | number (s) | `2.0` | Duration of the zoom animation. |

### Movement

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `smoothing` | number | `0.3` | Movement smoothing factor (0-1). 0 = raw tracking (jittery). 0.5 = smooth but laggy. 0.3 is a good balance. |

### Debug

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `showDebugVideo` | boolean | `false` | Show camera feed + landmarks on startup (without pressing `d`). |

---

## Hand Tracking + Other Modes

Hand tracking **coexists** with all other modes:
- **Mouse + Hand**: Both can move the emitter (hand takes over when detected, mouse resumes when hand is lost)
- **Audio + Hand**: Audio drives shape changes while hand controls position
- **Random + Hand**: Random mode runs alongside hand tracking
- **All four**: Mouse + random (`a`) + audio (`m`) + hand (`h`) can all run at once

---

## Performance Notes

- MediaPipe HandLandmarker uses WebAssembly + GPU delegation — much faster than the old TensorFlow.js approach
- Detection runs at ~15fps by default to keep CPU usage reasonable
- The model is loaded from CDN on first activation (~5MB download, cached after)
- Lower `detectionInterval` (e.g. `33` for 30fps) gives smoother tracking at higher CPU cost
- If tracking is laggy, increase `detectionInterval` to `100` (10fps)

---

## Vibe Recipes

### "Puppet master" — Tight control, fast response
```json
{
  "detectionInterval": 33,
  "smoothing": 0.1,
  "pinchThreshold": 0.05,
  "pinchCooldown": 300,
  "gestureCooldown": 500,
  "zoomFactor": 1.5
}
```
30fps detection, minimal smoothing, tight pinch threshold. Feels like directly controlling the particles.

### "Lazy conductor" — Smooth, deliberate
```json
{
  "detectionInterval": 100,
  "smoothing": 0.6,
  "pinchThreshold": 0.08,
  "pinchCooldown": 1000,
  "gestureCooldown": 1500,
  "zoomFactor": 1.2
}
```
10fps detection with heavy smoothing. Gestures need to be held deliberately. Good for performances.

### "Zoom DJ" — Gesture-focused
```json
{
  "detectionInterval": 50,
  "smoothing": 0.3,
  "pinchThreshold": 0.07,
  "pinchCooldown": 200,
  "gestureCooldown": 400,
  "zoomFactor": 2.0,
  "zoomDuration": 1.0
}
```
Fast gesture response with dramatic zoom. Great for live visual performances.
