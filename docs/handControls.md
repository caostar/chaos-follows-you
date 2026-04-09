# Hand Tracking Guide

The file `public/handControls.json` controls hand tracking behavior. Edit it and refresh — no rebuild needed.

**Toggle the hand panel**: Press `h` to show/hide the floating hand control panel.
**Toggle debug video**: Press `d` (while tracking is active) to see the camera feed with landmark overlay.
**Expand debug video**: Click the ⊕ button on the debug preview to go fullscreen (low-alpha video with bright landmarks).

---

## Gestures

Supports **up to 2 hands** simultaneously.

| Gesture | Hands | Action | Description |
|---------|-------|--------|-------------|
| ☝️ Point (index finger) | 1 | Move emitter | The emitter follows your index fingertip in real-time |
| 🤏 Pinch (thumb + index) | 1 or 2 | New chaos star | Bring thumb and index together on either hand |
| 🤲 Spread apart | 2 | Zoom in | Move both hands away from each other |
| 🤲 Come together | 2 | Zoom out | Move both hands toward each other |

The two-hand zoom feels like physically stretching or compressing the view — it tracks the delta between your wrists frame by frame, so it's smooth and proportional.

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

### Two-Hand Zoom

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `twoHandZoomThreshold` | number | `0.015` | Minimum wrist distance change per frame to trigger zoom. Lower = more sensitive. Higher = need bigger movements. |
| `twoHandZoomSensitivity` | number | `3.0` | How much hand distance maps to zoom speed. Higher = faster zoom for the same hand movement. |

### Movement

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `smoothing` | number | `0.3` | Movement smoothing factor (0-1). 0 = raw tracking (jittery). 0.5 = smooth but laggy. 0.3 is a good balance. |

### Debug

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `showDebugVideo` | boolean | `false` | Show camera feed + landmarks on startup (without pressing `d`). |
| `debugAlpha` | number | `0.2` | Opacity of the video feed in expanded fullscreen mode (0-1). Landmarks always render at full opacity. |

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
- Tracking 2 hands is slightly more expensive than 1, but still fast on modern hardware
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
  "twoHandZoomSensitivity": 5.0
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
  "twoHandZoomSensitivity": 1.5,
  "twoHandZoomThreshold": 0.03
}
```
10fps detection with heavy smoothing. Needs bigger hand movements to trigger zoom. Good for performances.

### "Zoom sculptor" — Focus on two-hand zoom
```json
{
  "detectionInterval": 50,
  "smoothing": 0.3,
  "pinchThreshold": 0.07,
  "pinchCooldown": 200,
  "twoHandZoomSensitivity": 6.0,
  "twoHandZoomThreshold": 0.01
}
```
Very sensitive two-hand zoom — small hand movements produce big zoom changes. Great for sculpting the view in real-time.
