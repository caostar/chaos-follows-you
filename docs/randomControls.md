# Random Mode Controls Guide

The file `public/randomControls.json` controls how the autonomous "random mode" behaves. You can edit it and refresh the browser to see changes instantly — no rebuild needed.

Random mode activates in two ways:
- **Press `a`** to toggle it on/off manually
- **Wait 30 seconds** without touching anything — it kicks in automatically and stops when you interact again

---

## Parameters Reference

### Top-level

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | `true` | Master switch. Set `false` to disable auto-activation entirely (manual toggle with `a` still works). |
| `toggleKey` | string | `"a"` | Keyboard key to toggle random mode on/off. |
| `inactivityTimeout` | number | `30` | Seconds of no interaction before random mode auto-starts. |

### `zoom` — Controls camera zoom behavior

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minScale` | number | `0.05` | Minimum zoom level. Prevents the scene from zooming out so far that everything disappears. Lower = more zoomed out allowed. |
| `maxScale` | number | `50` | Maximum zoom level. Prevents zooming in so far that the screen fills with a single pixel. Higher = more zoomed in allowed. |
| `inFactor` | `{min, max}` | `{1.2, 3.0}` | Random multiplier range when zooming **in**. A factor of 2.0 means "zoom to 2x current scale". Higher max = more dramatic zoom-ins. |
| `outFactor` | `{min, max}` | `{1.2, 3.0}` | Random multiplier range when zooming **out**. A factor of 2.0 means "zoom to half current scale". Higher max = more dramatic zoom-outs. |
| `inBias` | number | `0.5` | Probability of zooming **in** vs **out** (0.0 = always out, 1.0 = always in, 0.5 = equal chance). The system overrides this when near the min/max bounds to prevent hitting limits. |
| `duration` | `{min, max}` | `{2.0, 5.0}` | How long the zoom animation takes in seconds. Longer = smoother, more cinematic. Shorter = snappy. |
| `weight` | number | `10` | Relative probability of a zoom action vs other actions. See [Action Weights](#action-weights). |
| `cooldown` | number | `5.0` | Reserved for future use. Minimum seconds between zoom actions. |

### `movement` — Controls emitter wandering

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `duration` | `{min, max}` | `{1.5, 4.0}` | How long the emitter takes to travel to a new position (seconds). |
| `ease` | string | `"power2.inOut"` | GSAP easing function. Controls the acceleration curve of movement. |
| `weight` | number | `60` | Relative probability of a move action. |
| `cooldown` | number | `0.5` | Reserved for future use. |

**Available easing values:** `"power1.inOut"`, `"power2.inOut"`, `"power3.inOut"`, `"power4.inOut"`, `"elastic.out"`, `"bounce.out"`, `"back.inOut"`, `"sine.inOut"`, `"expo.inOut"`, `"circ.inOut"`, `"none"` (linear). See [GSAP Eases](https://gsap.com/docs/v3/Eases/).

### `shapeChange` — Controls how often a new chaos star design is generated

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `weight` | number | `30` | Relative probability of generating a new star shape. |
| `cooldown` | number | `1.0` | Reserved for future use. |

### `pause` — Occasional moments of stillness

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chance` | number | `0.15` | Probability (0-1) that any tick includes a pause before acting. 0 = never pause, 1 = always pause. |
| `duration` | `{min, max}` | `{1.0, 4.0}` | How long the pause lasts in seconds. |

### `rhythm` — Master timing

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `interval` | `{min, max}` | `{0.8, 3.0}` | Seconds between each action tick. The controller picks a random value in this range each time. Smaller = more frenetic. Larger = more contemplative. |

---

## Action Weights

Each tick, the controller randomly picks one action. The probability of each is its `weight` divided by the total of all weights.

With defaults (movement: 60, shapeChange: 30, zoom: 10):
- **Move**: 60% chance
- **New shape**: 30% chance
- **Zoom**: 10% chance

To make zoom happen more often, increase `zoom.weight`. To make it rarer, decrease it.

---

## Vibe Recipes

### "Meditative drift" — Slow, gentle, mostly movement
```json
{
  "zoom": { "weight": 3, "inFactor": {"min": 1.05, "max": 1.3}, "outFactor": {"min": 1.05, "max": 1.3}, "inBias": 0.5, "duration": {"min": 4.0, "max": 8.0} },
  "movement": { "weight": 80, "duration": {"min": 3.0, "max": 6.0}, "ease": "sine.inOut" },
  "shapeChange": { "weight": 17 },
  "pause": { "chance": 0.3, "duration": {"min": 2.0, "max": 6.0} },
  "rhythm": { "interval": {"min": 2.0, "max": 5.0} }
}
```
Long eases, frequent pauses, rare gentle zooms. The emitter glides slowly across the screen with occasional shape shifts.

### "Nervous energy" — Fast, chaotic, lots of shape changes
```json
{
  "zoom": { "weight": 15, "inFactor": {"min": 1.5, "max": 4.0}, "outFactor": {"min": 1.5, "max": 4.0}, "inBias": 0.5, "duration": {"min": 0.5, "max": 1.5} },
  "movement": { "weight": 40, "duration": {"min": 0.3, "max": 1.0}, "ease": "power4.out" },
  "shapeChange": { "weight": 45 },
  "pause": { "chance": 0.02, "duration": {"min": 0.2, "max": 0.5} },
  "rhythm": { "interval": {"min": 0.2, "max": 0.8} }
}
```
Rapid-fire shape changes, snappy movements, dramatic zooms. Almost no pauses. Feels anxious and alive.

### "Deep zoom explorer" — Keeps zooming in, occasional zoom out to reset
```json
{
  "zoom": { "weight": 50, "inFactor": {"min": 1.5, "max": 5.0}, "outFactor": {"min": 2.0, "max": 6.0}, "inBias": 0.8, "duration": {"min": 3.0, "max": 6.0}, "minScale": 0.01, "maxScale": 200 },
  "movement": { "weight": 30, "duration": {"min": 2.0, "max": 4.0}, "ease": "power2.inOut" },
  "shapeChange": { "weight": 20 },
  "pause": { "chance": 0.1, "duration": {"min": 1.0, "max": 3.0} },
  "rhythm": { "interval": {"min": 1.0, "max": 3.0} }
}
```
Constantly diving deeper. The `inBias: 0.8` means 80% of zooms go in. When it hits maxScale, the system forces a zoom out, creating a satisfying "reset" moment.

### "Breathing" — Rhythmic zoom in/out like breathing
```json
{
  "zoom": { "weight": 70, "inFactor": {"min": 1.3, "max": 1.8}, "outFactor": {"min": 1.3, "max": 1.8}, "inBias": 0.5, "duration": {"min": 2.5, "max": 4.0}, "minScale": 0.3, "maxScale": 5 },
  "movement": { "weight": 20, "duration": {"min": 2.0, "max": 3.0}, "ease": "sine.inOut" },
  "shapeChange": { "weight": 10 },
  "pause": { "chance": 0.0 },
  "rhythm": { "interval": {"min": 2.5, "max": 4.0} }
}
```
Tight zoom bounds (0.3-5) with equal in/out bias and gentle factors create a natural pulsing rhythm. The narrow scale range means it oscillates instead of drifting to extremes.

### "Mostly still, then erupts" — Long pauses with violent bursts
```json
{
  "zoom": { "weight": 25, "inFactor": {"min": 2.0, "max": 6.0}, "outFactor": {"min": 2.0, "max": 6.0}, "inBias": 0.5, "duration": {"min": 1.0, "max": 2.0} },
  "movement": { "weight": 50, "duration": {"min": 0.5, "max": 1.5}, "ease": "power4.out" },
  "shapeChange": { "weight": 25 },
  "pause": { "chance": 0.7, "duration": {"min": 3.0, "max": 10.0} },
  "rhythm": { "interval": {"min": 0.3, "max": 1.0} }
}
```
70% pause chance means it mostly sits still. But when it finally acts, the fast durations and aggressive zoom factors create sudden explosive moments.
