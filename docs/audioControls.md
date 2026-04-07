# Audio Reactivity Guide

The file `public/audioControls.json` controls how audio input drives visual chaos. Edit it and refresh the browser — no rebuild needed.

**Toggle the audio panel**: Press `m` to show/hide the floating audio control panel.

---

## Input Modes

### Stream
Click **▶ Stream** to play an internet radio stream. The default URL is `https://icecast2.ufpel.edu.br/live` (Radio da Universidade, Pelotas, Brazil). You can type any audio stream URL in the text field.

### File
Click **📁 File** to upload a local audio file (MP3, WAV, OGG, etc.). The file plays immediately and drives the visuals.

### Microphone
Click **🎤 Mic** to use your microphone as input. The browser will ask for permission. Output is muted to prevent feedback loops. Different thresholds apply in mic mode (overall energy instead of bass, since mic input is noisier).

### Stop
Click **⏹ Stop** to stop all audio input and visual reactions.

---

## Parameters Reference

### `defaultStream`
| Type | Default |
|------|---------|
| string | `"https://icecast2.ufpel.edu.br/live"` |

The URL loaded when you click the Stream button without entering a custom URL.

### `thresholds` — When to react

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `bass` | number | `0.63` | Bass energy threshold for stream/file mode. Audio must exceed this to trigger a visual reaction. Lower = more reactive, higher = only reacts to loud bass hits. |
| `mid` | number | `0.7` | Mid-range threshold. When exceeded, shape changes become twice as likely. |
| `treble` | number | `0.8` | Treble threshold. When exceeded, zoom actions become 3x more likely. |
| `micEnergy` | number | `0.1` | Overall energy threshold for mic mode. Much lower than bass because mic input is quieter and noisier. |

### `actions` — What happens when audio reacts

Each reaction tick, one action is chosen by weighted random selection:

| Action | Default Weight | Description |
|--------|---------------|-------------|
| `move` | 50 | Move the emitter to a random position. Higher bass = faster movement. |
| `shapeChange` | 40 | Generate a new chaos star design. |
| `zoomIn` | 5 | Zoom the camera in slightly (amount scales with bass). |
| `zoomOut` | 5 | Zoom the camera out slightly. |

Weights work the same as in random mode: each action's probability is its weight divided by the total. With defaults: move 50%, shape 40%, zoom in 5%, zoom out 5%.

**Dynamic weight boosts**: When mid-range or treble energy is high, the corresponding actions get temporary weight multipliers (shapeChange ×2 for mid, zoom ×3 for treble). This means busy, complex audio naturally produces more varied visual responses.

### `reactionCooldown`
| Type | Default |
|------|---------|
| number (ms) | `80` |

Minimum milliseconds between visual reactions. Prevents seizure-inducing rapid flickering. Set to 0 for maximum reactivity (not recommended). Set to 200+ for a calmer, more deliberate response.

### `bassMoveFactor`
| Type | Default |
|------|---------|
| number | `0.5` |

How much bass amplitude influences movement speed. At 0, all moves take the same time. At 1.0, loud bass hits cause very fast, snappy movements while quiet passages produce slow drifts.

### `sustainedZoom` — Gradual zoom from sustained energy

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the sustained zoom feature. |
| `frames` | number | `60` | How many consecutive frames (~1 second at 60fps) of high energy needed to trigger a zoom. |
| `threshold` | number | `0.5` | Average energy level over those frames that triggers the zoom. |
| `zoomFactor` | number | `1.3` | How much to zoom in (multiplier on current scale). |
| `duration` | number | `3.0` | Duration of the zoom animation in seconds. |

This creates a "building intensity" effect: when the music gets loud and stays loud, the camera gradually pushes in. After zooming, the energy buffer resets so it doesn't immediately zoom again.

---

## Audio + Other Modes

Audio reactivity **coexists** with both mouse input and random mode:
- **Mouse + Audio**: You control position with your mouse while audio triggers shape changes and zooms
- **Random + Audio**: Both drive visuals simultaneously for maximum chaos
- **All three**: Yes, mouse + random mode (`a`) + audio (`m`) can all run at once

---

## Vibe Recipes

### "Bass cannon" — Only reacts to heavy drops
```json
{
  "thresholds": { "bass": 0.85, "mid": 0.9, "treble": 0.95 },
  "actions": { "move": { "weight": 30 }, "shapeChange": { "weight": 60 }, "zoomIn": { "weight": 8 }, "zoomOut": { "weight": 2 } },
  "reactionCooldown": 150,
  "bassMoveFactor": 0.8
}
```
High thresholds mean only the loudest bass hits trigger reactions. When they do, shape changes dominate for maximum visual impact.

### "Ambient wash" — Gentle, continuous response
```json
{
  "thresholds": { "bass": 0.3, "mid": 0.4, "treble": 0.5, "micEnergy": 0.05 },
  "actions": { "move": { "weight": 70 }, "shapeChange": { "weight": 25 }, "zoomIn": { "weight": 3 }, "zoomOut": { "weight": 2 } },
  "reactionCooldown": 200,
  "bassMoveFactor": 0.2,
  "sustainedZoom": { "enabled": true, "frames": 120, "threshold": 0.3, "zoomFactor": 1.1, "duration": 5.0 }
}
```
Low thresholds + high cooldown = steady, flowing movement. Perfect for ambient/drone music. The sustained zoom slowly pushes in during loud sections.

### "Mic performer" — Great for live voice/instrument
```json
{
  "thresholds": { "micEnergy": 0.05 },
  "actions": { "move": { "weight": 40 }, "shapeChange": { "weight": 50 }, "zoomIn": { "weight": 5 }, "zoomOut": { "weight": 5 } },
  "reactionCooldown": 50,
  "bassMoveFactor": 0.6,
  "sustainedZoom": { "enabled": true, "frames": 30, "threshold": 0.15, "zoomFactor": 1.5, "duration": 2.0 }
}
```
Very sensitive mic threshold with fast cooldown — every sound gets a response. Short sustained zoom window means yelling or loud playing quickly zooms in for dramatic effect.

### "Seizure warning" — Maximum chaos (use responsibly)
```json
{
  "thresholds": { "bass": 0.1, "mid": 0.1, "treble": 0.1 },
  "actions": { "move": { "weight": 30 }, "shapeChange": { "weight": 30 }, "zoomIn": { "weight": 20 }, "zoomOut": { "weight": 20 } },
  "reactionCooldown": 0,
  "bassMoveFactor": 1.0,
  "sustainedZoom": { "enabled": false }
}
```
Everything reacts to everything with no cooldown. Zooms happen constantly. Not recommended for extended viewing.
