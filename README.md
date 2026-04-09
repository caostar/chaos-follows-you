# Chaos Follows You

**Interactive generative art — procedural chaos stars that react to your mouse, sound, and hands.**

A creative coding project that draws the <a href="https://en.wikipedia.org/wiki/Symbol_of_Chaos" target="_blank">Symbol of Chaos</a> as a swarm of WebGL particles. Each star is procedurally generated with random geometry — every click or beat spawns a unique form. The particles follow your cursor, respond to audio frequencies, and can be controlled with hand gestures via your webcam.

**<a href="https://caostar.com/chaos-follows-you" target="_blank">Live demo</a>**

![Chaos Follows You](https://img.shields.io/badge/pixi.js-v7-blue) ![MediaPipe](https://img.shields.io/badge/mediapipe-hand_tracking-green) ![Tests](https://img.shields.io/badge/tests-87_passing-brightgreen) ![License](https://img.shields.io/badge/license-Apache_2.0-orange)

---

## Features

### Mouse & Keyboard
Move the cursor to guide the particle emitter. Click to spawn a new chaos star shape. Keyboard shortcuts give direct control over movement, zoom, and shape generation.

### Random Autonomous Mode
Click the **🎲** tab or press `A` to toggle. Also auto-activates after 30 seconds of inactivity. The system takes over with organic movement, zoom drifts, and shape changes. A home-scale pull prevents runaway zoom — the camera always drifts back toward a comfortable level.

### Audio Reactivity
Click the **🔊** tab to expand the audio panel. Pick any station from the dropdown — it starts playing immediately. You can also upload a file or use your microphone. Bass triggers movement, mid-range drives shape changes, treble provokes zoom. Sustained high energy gradually pushes the camera in, then relaxes.

**16 built-in radio streams** from Brazil, USA, France, and internet radio — or paste any custom stream URL.

### Hand Tracking
Click the **✋** tab, then **Start Tracking**. Your webcam activates with a fullscreen overlay showing your hand landmarks behind the chaos stars. Uses <a href="https://developers.google.com/mediapipe" target="_blank">MediaPipe</a> HandLandmarker (WASM + GPU) for real-time detection:

| Gesture | Action |
|---------|--------|
| ☝️ Point (index finger) | Move emitter |
| 🤏 Pinch (thumb + index) | New chaos star |
| 🤲 Two hands spread apart | Smooth zoom in |
| 🤲 Two hands come together | Smooth zoom out |

### Controls Panel
Click the **⚙** tab or press `G` to open the full controls panel. Every parameter for every mode is editable in real-time — sliders, toggles, and number inputs with info tooltips explaining each setting. Includes:

- **Tabbed sections** for Random, Audio, and Hand parameters
- **5 built-in presets** per mode (e.g. "Meditative drift", "Bass cannon", "Zoom sculptor")
- **Save/Load** your own configurations to browser localStorage with custom names
- **Keyboard shortcuts** reference tab

All changes take effect immediately — no refresh needed.

### All Modes Coexist
Mouse, random mode, audio, and hand tracking can all run simultaneously. Turn on a radio stream, enable hand tracking, and let random mode fill in the gaps — maximum chaos.

---

## Getting Started

```bash
git clone https://github.com/caostar/chaos-follows-you.git
cd chaos-follows-you
npm install
npm start
```

Open <a href="http://localhost:5173" target="_blank">http://localhost:5173</a> and move your mouse.

### Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run all 87 tests via Vitest |
| `STREAM_CHECK=1 npm test` | Also verify all radio streams are reachable |

### Requirements

- Node.js 18+ (tested on 22)
- A browser with WebGL support
- Webcam (optional, for hand tracking)
- Microphone (optional, for audio reactivity)

---

## On-Screen Controls

All features are accessible through collapsible panels on the left side of the screen. Click any emoji tab to expand its panel.

| Tab | What it does |
|-----|-------------|
| **🔊** | Audio — pick a radio stream, upload a file, or use your mic |
| **✋** | Hand tracking — start/stop camera, toggle debug video |
| **⚙** | Controls — edit all parameters live, presets, save/load configs |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Mouse move** | Guide the particle emitter |
| **Click** | New chaos star shape |
| `Space` | New chaos star |
| `R` | Random move |
| `T` | Random move (alternate) |
| `Z` / `X` | Zoom in / out |
| `Arrow keys` | Move emitter directionally |
| `A` | Toggle random autonomous mode |
| `M` | Toggle audio panel |
| `H` | Toggle hand tracking panel |
| `G` | Toggle controls panel |
| `D` | Toggle hand debug video |
| `F` | Toggle browser fullscreen |
| `Q` | Hide/show all panels at once |

---

## Configuration

### Live Controls (recommended)
Open the **⚙ Controls** panel to edit any parameter in real-time. Changes apply instantly. Use the preset dropdown to quickly switch between tuned configurations, or save your own with a custom name — stored in your browser's localStorage and available next time you visit.

### JSON Files (developer defaults)
The files in `public/` define the starting configuration loaded on page refresh:

| File | Controls |
|------|----------|
| `randomControls.json` | Random mode timing, action weights, zoom bounds, home scale |
| `audioControls.json` | Audio thresholds, action weights, zoom limits, sustained zoom |
| `handControls.json` | Detection interval, pinch/zoom thresholds, smoothing, debug alpha |

These serve as defaults — any changes made through the Controls panel override them until the page is refreshed.

See the detailed parameter guides:
- <a href="docs/randomControls.md" target="_blank">Random Mode Controls</a>
- <a href="docs/audioControls.md" target="_blank">Audio Controls</a>
- <a href="docs/handControls.md" target="_blank">Hand Tracking Controls</a>

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

## Architecture

```
src/
  index.js                     Entry point
  core/
    Application.js             Pixi.js app, viewport, resize
    AssetManager.js            Asset discovery + PIXI.Assets
  scenes/
    Splash.js                  Loading screen
    Play.js                    Main scene — emitter, input, all controller wiring
  controllers/
    RandomController.js        Autonomous mode with home-scale zoom correction
    AudioController.js         FFT analysis → visual reactions with zoom clamping
    HandController.js          MediaPipe hand detection → smooth gesture zoom
  ui/
    AudioPanel.js              Audio panel with radio stream dropdown
    HandPanel.js               Hand tracking panel
    ControlsPanel.js           Full parameter editor with presets and save/load
    ConfigSection.js           Reusable control renderer (sliders/toggles/inputs)
    controlSchemas.js          Schema definitions, tooltips, and preset data
    radioStreams.js             Curated radio stream list
  builders/
    PixiChaosStar.js           Procedural chaos star geometry generator
public/
    randomControls.json        Default config for random mode
    audioControls.json         Default config for audio reactivity
    handControls.json          Default config for hand tracking
```

---

## Built-in Radio Streams

Select any stream from the audio panel dropdown to start audio-reactive visuals instantly.

| Country | Station | Genre |
|---------|---------|-------|
| 🇧🇷 Brazil | UFPel Radio | Pop/Eclectic |
| 🇺🇸 USA | <a href="https://somafm.com" target="_blank">SomaFM</a> Groove Salad | Ambient/Downtempo |
| 🇺🇸 USA | <a href="https://somafm.com" target="_blank">SomaFM</a> Drone Zone | Space Ambient |
| 🇺🇸 USA | <a href="https://somafm.com" target="_blank">SomaFM</a> DEF CON | Dark Electronic |
| 🇺🇸 USA | <a href="https://somafm.com" target="_blank">SomaFM</a> Deep Space One | Deep House |
| 🇺🇸 USA | <a href="https://somafm.com" target="_blank">SomaFM</a> Left Coast 70s | Classic Rock |
| 🇺🇸 USA | <a href="https://somafm.com" target="_blank">SomaFM</a> Lush | Sensual Downtempo |
| 🇺🇸 USA | <a href="https://somafm.com" target="_blank">SomaFM</a> Space Station Soma | Ambient |
| 🇺🇸 USA | <a href="https://radioparadise.com" target="_blank">Radio Paradise</a> | Eclectic Rock |
| 🇺🇸 USA | <a href="https://181.fm" target="_blank">181.fm</a> Classical | Orchestral |
| 🇫🇷 France | <a href="https://www.radiofrance.fr/fip" target="_blank">FIP</a> | Eclectic World/Jazz |
| 🇫🇷 France | <a href="https://www.radiofrance.fr/fip" target="_blank">FIP Jazz</a> | 24/7 Jazz |
| 🇫🇷 France | <a href="https://www.radiofrance.fr/fip" target="_blank">FIP Electro</a> | Electronic |
| 🇫🇷 France | <a href="https://www.radiofrance.fr/fip" target="_blank">FIP World</a> | World Music |
| 🇫🇷 France | <a href="https://www.radiofrance.fr/fip" target="_blank">FIP Hip-Hop</a> | Rap/Hip-Hop |
| 🌐 Internet | <a href="https://plaza.one" target="_blank">Plaza One</a> | Vaporwave/Future Funk |

You can also paste any direct audio stream URL using the **Custom URL...** option.

### Stream Credits

Thank you to these stations for providing free, high-quality audio streams:

- <a href="https://somafm.com" target="_blank"><strong>SomaFM</strong></a> — Listener-supported, commercial-free internet radio from San Francisco. 30+ unique channels. Please consider <a href="https://somafm.com/support/" target="_blank">donating</a>.
- <a href="https://www.radiofrance.fr/fip" target="_blank"><strong>Radio France / FIP</strong></a> — French public radio with exceptional eclectic programming. FIP's thematic channels are some of the best curated streams available.
- <a href="https://radioparadise.com" target="_blank"><strong>Radio Paradise</strong></a> — Listener-supported eclectic rock from Paradise, California. A beloved internet radio institution since 2000.
- <a href="https://181.fm" target="_blank"><strong>181.fm</strong></a> — Free internet radio with dozens of genre-specific channels.
- <a href="https://plaza.one" target="_blank"><strong>Plaza One</strong></a> — 24/7 vaporwave and future funk radio. A love letter to internet culture.
- **UFPel Radio** — University radio from Universidade Federal de Pelotas, Brazil.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| <a href="https://pixijs.com/" target="_blank">Pixi.js</a> v7 | 2D WebGL rendering |
| <a href="https://github.com/pixijs/particle-emitter" target="_blank">@pixi/particle-emitter</a> v5 | Behavior-based particle system |
| <a href="https://github.com/davidfig/pixi-viewport" target="_blank">pixi-viewport</a> | Camera, zoom, drag, pinch |
| <a href="https://greensock.com/gsap/" target="_blank">GSAP</a> | Animation tweening |
| <a href="https://github.com/hvianna/audioMotion-analyzer" target="_blank">audiomotion-analyzer</a> | FFT audio analysis |
| <a href="https://developers.google.com/mediapipe" target="_blank">MediaPipe</a> HandLandmarker | Hand gesture detection (WASM + GPU) |
| <a href="https://vitejs.dev/" target="_blank">Vite</a> | Build tool and dev server |
| <a href="https://vitest.dev/" target="_blank">Vitest</a> | Test framework |
| <a href="https://github.com/RobertWHurst/KeyboardJS" target="_blank">KeyboardJS</a> | Keyboard input handling |

---

## Browser Support

Works in all modern browsers with WebGL. Some features need permissions:

- **Hand tracking**: Camera permission + HTTPS (or localhost)
- **Audio streams**: CORS-compatible stream URLs (all built-in streams are verified)
- **Microphone**: Microphone permission + HTTPS (or localhost)

Tested on Chrome, Firefox, Safari, and Edge.

---

## Contributing

This is an art project — contributions that add new interaction modes, visual effects, or performance improvements are welcome.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm test` (all 87 tests must pass)
5. Submit a PR

---

## License

<a href="LICENSE" target="_blank">Apache 2.0</a>

---

**Created by <a href="https://caostar.com" target="_blank">Caostar</a>**
