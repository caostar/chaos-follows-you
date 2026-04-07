# Audio Reactivity — Manual Test Guide

Run `npm start` and open http://localhost:5173 in your browser.

---

## 1. Audio Panel Toggle

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Press `m` | Audio panel appears in the top-right corner. Console shows `[AudioPanel] Shown` |
| 1.2 | Press `m` again | Panel disappears. Console shows `[AudioPanel] Hidden` |
| 1.3 | Press `m` to show it again | Keep it open for the next tests |

---

## 2. Stream Mode

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Click **▶ Stream** | Status changes from "off" to "📡 stream" (cyan text). Console shows `[AudioMode] Starting (stream)` then `[AudioMode] Playing stream: https://icecast2.ufpel.edu.br/live` |
| 2.2 | Wait a few seconds | You should hear radio audio from the stream. The energy bar and frequency bands (bass/low/mid/high/treb) should start moving |
| 2.3 | Watch the chaos stars | When the music has bass hits, the emitter should move and shapes should change. Visuals react to the audio |
| 2.4 | Move your mouse | Mouse control should still work at the same time — audio and mouse coexist |
| 2.5 | Click **⏹ Stop** | Audio stops. Status goes back to "off". Console shows `[AudioMode] Stopped (was stream)`. Energy bars go flat |

**If the stream doesn't load** (it's a Brazilian university radio, might be down), try pasting any other stream URL in the text field, e.g.:
- `https://stream.radioparadise.com/aac-320` (Radio Paradise)
- `https://ice1.somafm.com/groovesalad-128-mp3` (SomaFM Groove Salad)

---

## 3. File Mode

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Click **📁 File** | A file picker dialog opens |
| 3.2 | Select any audio file (MP3, WAV, OGG) | Filename appears next to the button. Status changes to "🎵 file". Console shows `[AudioMode] Starting (file)` then `[AudioMode] Playing file` |
| 3.3 | Watch | Audio plays, energy bars react, chaos stars respond to the music |
| 3.4 | Click **⏹ Stop** | Audio stops, status resets |

---

## 4. Microphone Mode

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Click **🎤 Mic** | Browser asks for microphone permission |
| 4.2 | Allow mic access | Status changes to "🎤 mic". Console shows `[AudioMode] Starting (mic)` then `[AudioMode] Microphone active` |
| 4.3 | Speak or clap near the mic | Energy bars should react. Chaos stars should move/change in response. **You should NOT hear your own voice** (output is muted to prevent feedback) |
| 4.4 | Be silent | Energy bars should go quiet, visuals should stop reacting |
| 4.5 | Click **⏹ Stop** | Mic stops, status resets |

---

## 5. Mode Switching

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Click **▶ Stream** | Stream starts |
| 5.2 | Click **🎤 Mic** (without stopping first) | Stream stops automatically, mic starts. Console shows `[AudioMode] Stopped (was stream)` then `[AudioMode] Starting (mic)`. No errors |
| 5.3 | Click **📁 File** and pick a file | Mic stops automatically, file starts. Clean switch, no errors |
| 5.4 | Click **⏹ Stop** | Everything stops cleanly |

---

## 6. Coexistence with Other Modes

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Start a stream (click **▶ Stream**) | Audio playing |
| 6.2 | Press `a` to toggle random mode ON | Console shows `[Mode] Random mode toggled ON (manual)`. Now BOTH random mode and audio are driving visuals simultaneously |
| 6.3 | Move mouse around | All three inputs coexist: mouse + random + audio |
| 6.4 | Press `a` to toggle random mode OFF | Random stops, audio continues |
| 6.5 | Click **⏹ Stop** | Audio stops. Only mouse remains |

---

## 7. URL Input Field

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Click inside the URL text field | Cursor appears, you can type |
| 7.2 | Type some characters (like `abc`) | Characters appear in the field. **The chaos stars should NOT react to your typing** (keys like `a`, `r`, `z` should not trigger game hotkeys while typing in the field) |
| 7.3 | Click outside the field, then press `r` | NOW the `r` hotkey should work (move emitter randomly) |

---

## 8. Panel Persistence

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Start a stream | Audio playing, panel shows "📡 stream" |
| 8.2 | Press `m` to hide the panel | Panel disappears, but **audio keeps playing** (you can still hear it) |
| 8.3 | Press `m` to show the panel again | Panel reappears, still shows "📡 stream", energy bars are still moving |

---

## 9. Console Log Verification

Open browser DevTools (F12 → Console tab) and check for these log patterns:

```
[AudioMode] Starting (stream)
[AudioMode] Playing stream: https://icecast2.ufpel.edu.br/live
[AudioMode] Stopped (was stream)
[AudioMode] Starting (file)
[AudioMode] Playing file
[AudioMode] Stopped (was file)
[AudioMode] Starting (mic)
[AudioMode] Microphone active
[AudioMode] Stopped (was mic)
[AudioPanel] Shown
[AudioPanel] Hidden
```

**There should be NO red errors** related to audio. The only warnings you might see are the PixiJS deprecation warnings about `interactive` — those are pre-existing and harmless.

---

## Things to Tweak (if it works)

The file `public/audioControls.json` controls all audio reactivity behavior. Try changing:

- **`thresholds.bass`**: Lower (e.g. `0.3`) = more reactive, higher (e.g. `0.8`) = only reacts to loud bass
- **`reactionCooldown`**: Lower (e.g. `30`) = faster reactions, higher (e.g. `200`) = calmer
- **`bassMoveFactor`**: `0` = all moves same speed, `1.0` = loud bass = fast snappy moves
- **`actions` weights**: Change move/shapeChange/zoomIn/zoomOut ratios

Save the file and refresh the browser — no rebuild needed.
