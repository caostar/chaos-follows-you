# Audio Reactivity — Manual Test Guide

Run `npm start` and open http://localhost:5173.

---

## 1. Audio Panel

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Look at the top-left corner | You should see a collapsed 🔊 tab |
| 1.2 | Click the 🔊 tab | Panel expands showing Stream, File, Mic, Stop buttons |
| 1.3 | Click the 🔊 tab again | Panel collapses back to emoji |
| 1.4 | Press `m` | Panel disappears entirely |
| 1.5 | Press `m` again | Panel reappears (in same collapsed/expanded state) |

---

## 2. Stream Mode

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Expand the audio panel, click **▶ Stream** | Status shows 📡. Console: `[AudioMode] Starting (stream)` |
| 2.2 | Wait a few seconds | Audio plays. Energy bar and frequency bands start moving |
| 2.3 | Watch the chaos stars | Emitter moves and shapes change in response to bass hits |
| 2.4 | Move your mouse | Mouse control still works alongside audio |
| 2.5 | Click **⏹ Stop** | Audio stops, energy bars go flat |

**Alternative streams** (if default is down):
- `https://stream.radioparadise.com/aac-320`
- `https://ice1.somafm.com/groovesalad-128-mp3`

---

## 3. File Mode

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Click **📁 File** | File picker opens |
| 3.2 | Select an audio file | Filename appears, audio plays, visuals react |
| 3.3 | Click **⏹ Stop** | Audio stops |

---

## 4. Microphone Mode

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Click **🎤 Mic** | Browser asks for mic permission |
| 4.2 | Allow access | Status shows 🎤. You should NOT hear yourself (output muted) |
| 4.3 | Speak or clap | Energy bars react, visuals respond |
| 4.4 | Click **⏹ Stop** | Mic stops |

---

## 5. Mode Switching

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Start stream, then click **🎤 Mic** | Stream stops cleanly, mic starts. No errors |
| 5.2 | Click **📁 File** and pick a file | Mic stops, file plays. No errors |
| 5.3 | Start stream again | File stops, stream plays. No errors |

---

## 6. Coexistence

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Start a stream | Audio playing |
| 6.2 | Press `a` | Random mode + audio both drive visuals |
| 6.3 | Press `h`, expand, start hand tracking | All three modes coexist |
| 6.4 | Move mouse | All four inputs work simultaneously |

---

## 7. Runtime Config

Edit `public/audioControls.json`, save, refresh browser. Try lowering `thresholds.bass` to `0.3` for more reactivity.
