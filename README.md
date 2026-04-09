# Chaos Follows You

**Interactive generative art — procedural chaos stars that react to your mouse, sound, and hands.**

A creative coding project that draws the [Symbol of Chaos](https://en.wikipedia.org/wiki/Symbol_of_Chaos) as a swarm of WebGL particles. Each star is procedurally generated with random geometry — every click or beat spawns a unique form. The particles follow your cursor, respond to audio frequencies, and can be controlled with hand gestures via your webcam.

**Live:** [caostar.com/chaos-follows-you](https://caostar.com/chaos-follows-you)

![Chaos Follows You](https://img.shields.io/badge/pixi.js-v7-blue) ![MediaPipe](https://img.shields.io/badge/mediapipe-hand_tracking-green) ![Tests](https://img.shields.io/badge/tests-79_passing-brightgreen) ![License](https://img.shields.io/badge/license-Apache_2.0-orange)

---

## Features

### Mouse & Keyboard
Move the cursor to guide the particle emitter. Click to spawn a new chaos star shape. Use keyboard shortcuts for direct control over movement, zoom, and shape generation.

### Random Autonomous Mode
Press `a` or wait 30 seconds — the system takes over with organic movement, zoom drifts, and shape changes at configurable intervals. Weighted random actions, cooldowns, and zoom bounds keep things interesting without going off the rails.

### Audio Reactivity
Press `m` to open the audio panel. Play an internet radio stream, upload a local audio file, or use your microphone. Bass triggers movement, mid-range drives shape changes, treble provokes zoom. Sustained high energy gradually pushes the camera in.

### Hand Tracking
Press `h` to open the hand panel. Uses MediaPipe HandLandmarker (WASM + GPU) for real-time detection via webcam:

| Gesture | Action |
|---------|--------|
| Point (index finger) | Move emitter |
| Pinch (thumb + index) | New chaos star |
| Two hands spread apart | Zoom in |
| Two hands come together | Zoom out |

### Runtime Configuration
All behaviors are controlled by JSON files in `public/`. Edit and refresh — no rebuild needed:

| File | Controls |
|------|----------|
| `randomControls.json` | Random mode timing, weights, zoom bounds, cooldowns |
| `audioControls.json` | Audio thresholds, action weights, reaction cooldown |
| `handControls.json` | Detection interval, gesture thresholds, smoothing |

---

## Getting Started

```bash
git clone https://github.com/caostar/chaos-follows-you.git
cd chaos-follows-you
npm install
npm start
```

Open http://localhost:5173 and move your mouse.

### Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run all 79 tests via Vitest |

### Requirements

- Node.js 18+ (tested on 22)
- A browser with WebGL support
- Webcam (optional, for hand tracking)
- Microphone (optional, for audio reactivity)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Mouse move** | Guide the particle emitter |
| **Click** | New chaos star shape |
| `r` | Random move |
| `t` | Random move (alternate) |
| `z` / `x` | Zoom in / out |
| `Space` | New chaos star |
| `Arrow keys` | Move emitter directionally |
| `a` | Toggle random autonomous mode |
| `m` | Toggle audio panel visibility |
| `h` | Toggle hand tracking panel visibility |
| `d` | Toggle hand tracking debug video (when tracking active) |
| `g` | Toggle controls panel |
| `f` | Toggle browser fullscreen |
| `q` | Hide/show all panels |

---

## Architecture

```
src/
  index.js                     Entry point — creates Application on DOM load
  Game.js                      Game loop
  config.js                    Global configuration

  core/
    Application.js             Pixi.js app, viewport, resize handling
    AssetManager.js            Asset discovery via import.meta.glob + PIXI.Assets
    utils.js                   Viewport fitting helpers

  scenes/
    Scene.js                   Base scene class
    Splash.js                  Loading screen with progress bar
    Play.js                    Main scene — emitter, input, controller wiring

  controllers/
    RandomController.js        Autonomous mode — weighted actions, cooldowns, zoom
    AudioController.js         Audio FFT analysis → visual reactions
    HandController.js          MediaPipe hand detection → gestures

  ui/
    AudioPanel.js              Collapsible audio control panel
    HandPanel.js               Collapsible hand tracking panel

  builders/
    PixiChaosStar.js           Procedural chaos star geometry generator

  assets/
    textures/                  Color and shape textures for particles

public/
    randomControls.json        Runtime config for random mode
    audioControls.json         Runtime config for audio reactivity
    handControls.json          Runtime config for hand tracking
```

---

## How the Chaos Star Works

Each star is an 8-pointed procedural shape drawn with `PIXI.Graphics`. The generator randomizes:

- **Bar width & length** — the arms of the star
- **Arrow sharpness** — how pointed the tips are (top and bottom independently)
- **Arrow width** — spread of the arrowhead
- **Circle size** — the central hub
- **Rotation angle** — each arm's offset

The graphic is rendered to a texture via `renderer.generateTexture()`, then used as a particle sprite by `@pixi/particle-emitter`. Hundreds of these particles are emitted simultaneously, creating the layered, organic look.

When you click, press Space, pinch, or trigger an audio reaction, a completely new star is generated with fresh random parameters.

---

## Configuration Deep Dive

All config files live in `public/` and are loaded via `fetch()` at startup. Edit them with any text editor and refresh the browser.

### Random Mode (`randomControls.json`)

Controls the autonomous behavior that activates on idle or when pressing `a`. Key parameters:

- **`rhythm.interval`** — seconds between actions (min/max range)
- **`zoom.inBias`** — probability of zooming in vs out (0 = always out, 1 = always in)
- **`zoom.minScale` / `maxScale`** — camera zoom bounds
- **Action weights** — relative probability of move, shape change, or zoom
- **Cooldowns** — minimum seconds between each action type

See [docs/randomControls.md](docs/randomControls.md) for full reference and vibe recipes.

### Audio (`audioControls.json`)

Controls how sound drives visuals. Key parameters:

- **`thresholds.bass`** — bass energy level that triggers a reaction (lower = more reactive)
- **`actions` weights** — what happens when audio reacts (move, shape change, zoom)
- **`reactionCooldown`** — minimum ms between visual reactions
- **`sustainedZoom`** — gradual zoom from sustained high energy

See [docs/audioControls.md](docs/audioControls.md) for full reference and vibe recipes.

### Hand Tracking (`handControls.json`)

Controls gesture detection behavior. Key parameters:

- **`detectionInterval`** — ms between detections (66 = ~15fps)
- **`pinchThreshold`** — distance for pinch detection (lower = tighter pinch required)
- **`smoothing`** — movement smoothing (0 = raw, 0.5 = smooth but laggy)
- **`gestureCooldown`** — ms between zoom gestures

See [docs/handControls.md](docs/handControls.md) for full reference and vibe recipes.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Pixi.js](https://pixijs.com/) v7 | 2D WebGL rendering |
| [@pixi/particle-emitter](https://github.com/pixijs/particle-emitter) v5 | Behavior-based particle system |
| [pixi-viewport](https://github.com/davidfig/pixi-viewport) | Camera, zoom, drag, pinch |
| [GSAP](https://greensock.com/gsap/) | Animation tweening |
| [audiomotion-analyzer](https://github.com/hvianna/audioMotion-analyzer) | FFT audio analysis |
| [MediaPipe](https://developers.google.com/mediapipe) HandLandmarker | Hand gesture detection (WASM + GPU) |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [Vitest](https://vitest.dev/) | Test framework |
| [KeyboardJS](https://github.com/RobertWHurst/KeyboardJS) | Keyboard input handling |

---

## Browser Support

Works in all modern browsers with WebGL. Hand tracking and audio features require:

- **Hand tracking**: Camera permission, HTTPS (or localhost)
- **Audio stream**: CORS-compatible stream URL
- **Microphone**: Microphone permission, HTTPS (or localhost)

Tested on Chrome, Firefox, Safari, and Edge.

---

## Built-in Radio Streams

The audio panel includes curated free internet radio streams. Select any stream from the dropdown to start audio-reactive visuals instantly.

| Country | Station | Genre | URL |
|---------|---------|-------|-----|
| 🇧🇷 Brazil | UFPel Radio | Pop/Eclectic | `icecast2.ufpel.edu.br/live` |
| 🇺🇸 USA | [SomaFM](https://somafm.com) Groove Salad | Ambient/Downtempo | `ice1.somafm.com/groovesalad-256-mp3` |
| 🇺🇸 USA | [SomaFM](https://somafm.com) Drone Zone | Space Ambient | `ice1.somafm.com/dronezone-256-mp3` |
| 🇺🇸 USA | [SomaFM](https://somafm.com) DEF CON | Dark Electronic | `ice1.somafm.com/defcon-256-mp3` |
| 🇺🇸 USA | [SomaFM](https://somafm.com) Deep Space One | Deep House | `ice1.somafm.com/deepspaceone-128-mp3` |
| 🇺🇸 USA | [SomaFM](https://somafm.com) Left Coast 70s | Classic Rock | `ice1.somafm.com/seventies-320-mp3` |
| 🇺🇸 USA | [SomaFM](https://somafm.com) Lush | Sensual Downtempo | `ice1.somafm.com/lush-128-mp3` |
| 🇺🇸 USA | [SomaFM](https://somafm.com) Space Station Soma | Ambient | `ice1.somafm.com/spacestation-128-mp3` |
| 🇺🇸 USA | [Radio Paradise](https://radioparadise.com) | Eclectic Rock | `stream.radioparadise.com/aac-320` |
| 🇺🇸 USA | [181.fm](https://181.fm) Classical | Orchestral | `listen.181fm.com/181-classical_128k.mp3` |
| 🇫🇷 France | [FIP](https://www.radiofrance.fr/fip) | Eclectic World/Jazz | `icecast.radiofrance.fr/fip-midfi.mp3` |
| 🇫🇷 France | [FIP Jazz](https://www.radiofrance.fr/fip) | 24/7 Jazz | `icecast.radiofrance.fr/fipjazz-midfi.mp3` |
| 🇫🇷 France | [FIP Electro](https://www.radiofrance.fr/fip) | Electronic | `icecast.radiofrance.fr/fipelectro-midfi.mp3` |
| 🇫🇷 France | [FIP World](https://www.radiofrance.fr/fip) | World Music | `icecast.radiofrance.fr/fipworld-midfi.mp3` |
| 🇫🇷 France | [FIP Hip-Hop](https://www.radiofrance.fr/fip) | Rap/Hip-Hop | `icecast.radiofrance.fr/fiphiphop-midfi.mp3` |
| 🌐 Internet | [Plaza One](https://plaza.one) | Vaporwave/Future Funk | `radio.plaza.one/mp3` |

**Thank you** to these stations for providing free, high-quality audio streams:
- [**SomaFM**](https://somafm.com) — Listener-supported, commercial-free internet radio from San Francisco. 30+ unique channels. Please consider [donating](https://somafm.com/support/).
- [**Radio France / FIP**](https://www.radiofrance.fr/fip) — French public radio with exceptional eclectic programming. FIP's thematic channels (Jazz, Electro, World, Hip-Hop) are some of the best curated streams available.
- [**Radio Paradise**](https://radioparadise.com) — Listener-supported eclectic rock from Paradise, California. A beloved internet radio institution since 2000.
- [**181.fm**](https://181.fm) — Free internet radio with dozens of genre-specific channels.
- [**Plaza One**](https://plaza.one) — 24/7 vaporwave and future funk radio. A love letter to internet culture.
- **UFPel Radio** — University radio from Universidade Federal de Pelotas, Brazil.

You can also paste any direct stream URL using the "Custom URL..." option in the dropdown.

---

## Contributing

This is an art project — contributions that add new interaction modes, visual effects, or performance improvements are welcome.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm test` (all 79 tests must pass)
5. Submit a PR

---

## License

[Apache 2.0](LICENSE)

---

**Created by [Caostar](https://caostar.com)**
