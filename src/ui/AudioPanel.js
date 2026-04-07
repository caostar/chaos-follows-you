/**
 * AudioPanel — Floating DOM overlay for audio input controls.
 *
 * Toggled with the 'm' key. Provides buttons for stream, file upload,
 * and microphone input. Shows current audio status and a small
 * energy bar visualization.
 */
export default class AudioPanel {
  constructor(audioController) {
    this.controller = audioController;
    this.visible = false;
    this._panel = null;
    this._statusEl = null;
    this._energyBar = null;
    this._streamUrlInput = null;
    this._animFrame = null;

    this._build();
  }

  toggle() {
    this.visible = !this.visible;
    this._panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) {
      this._startEnergyLoop();
    } else {
      this._stopEnergyLoop();
    }
    console.log(`[AudioPanel] ${this.visible ? 'Shown' : 'Hidden'}`);
  }

  show() {
    if (!this.visible) this.toggle();
  }

  hide() {
    if (this.visible) this.toggle();
  }

  destroy() {
    this._stopEnergyLoop();
    if (this._panel) {
      this._panel.remove();
      this._panel = null;
    }
  }

  _build() {
    const panel = document.createElement('div');
    panel.id = 'audio-panel';
    panel.innerHTML = `
      <div class="ap-header">
        <span class="ap-title">🔊 Audio</span>
        <span class="ap-status">off</span>
      </div>
      <div class="ap-body">
        <div class="ap-row">
          <button class="ap-btn" data-action="stream">▶ Stream</button>
          <input type="text" class="ap-input" placeholder="stream URL" value="${this.controller.config.defaultStream}">
        </div>
        <div class="ap-row">
          <button class="ap-btn" data-action="file">📁 File</button>
          <input type="file" class="ap-file-input" accept="audio/*" style="display:none">
          <span class="ap-filename">no file</span>
        </div>
        <div class="ap-row">
          <button class="ap-btn" data-action="mic">🎤 Mic</button>
        </div>
        <div class="ap-row">
          <button class="ap-btn ap-btn-stop" data-action="stop">⏹ Stop</button>
        </div>
        <div class="ap-energy">
          <div class="ap-energy-bar"></div>
        </div>
        <div class="ap-bands">
          <div class="ap-band" data-band="bass"><div class="ap-band-fill"></div><span>bass</span></div>
          <div class="ap-band" data-band="lowMid"><div class="ap-band-fill"></div><span>low</span></div>
          <div class="ap-band" data-band="mid"><div class="ap-band-fill"></div><span>mid</span></div>
          <div class="ap-band" data-band="highMid"><div class="ap-band-fill"></div><span>high</span></div>
          <div class="ap-band" data-band="treble"><div class="ap-band-fill"></div><span>treb</span></div>
        </div>
      </div>
    `;

    this._applyStyles(panel);
    document.body.appendChild(panel);
    // Start visible so the user sees the audio controls immediately.
    // Press 'm' to hide/show.
    this.visible = true;
    this._startEnergyLoop();

    this._panel = panel;
    this._statusEl = panel.querySelector('.ap-status');
    this._energyBar = panel.querySelector('.ap-energy-bar');
    this._streamUrlInput = panel.querySelector('.ap-input');
    this._bandFills = {};
    panel.querySelectorAll('.ap-band').forEach((el) => {
      this._bandFills[el.dataset.band] = el.querySelector('.ap-band-fill');
    });

    // Wire up buttons
    panel.querySelector('[data-action="stream"]').addEventListener('click', () => {
      const url = this._streamUrlInput.value.trim();
      this.controller.start('stream', url || undefined);
      this._updateStatus('stream');
    });

    const fileInput = panel.querySelector('.ap-file-input');
    const filenameEl = panel.querySelector('.ap-filename');
    panel.querySelector('[data-action="file"]').addEventListener('click', () => {
      fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        filenameEl.textContent = file.name;
        this.controller.start('file', file);
        this._updateStatus('file');
      }
    });

    panel.querySelector('[data-action="mic"]').addEventListener('click', () => {
      this.controller.start('mic');
      this._updateStatus('mic');
    });

    panel.querySelector('[data-action="stop"]').addEventListener('click', () => {
      this.controller.stop();
      this._updateStatus('off');
    });

    // Prevent keyboard shortcuts from firing when typing in the URL input
    this._streamUrlInput.addEventListener('keydown', (e) => e.stopPropagation());
    this._streamUrlInput.addEventListener('keyup', (e) => e.stopPropagation());
    this._streamUrlInput.addEventListener('keypress', (e) => e.stopPropagation());
  }

  _updateStatus(mode) {
    const labels = { stream: '📡 stream', file: '🎵 file', mic: '🎤 mic', off: 'off' };
    this._statusEl.textContent = labels[mode] || mode;
    this._statusEl.className = `ap-status ${mode !== 'off' ? 'ap-active' : ''}`;
  }

  _startEnergyLoop() {
    const update = () => {
      if (!this.visible) return;
      const bands = this.controller.getBands();
      if (bands) {
        // Overall energy bar
        this._energyBar.style.width = `${bands.energy * 100}%`;

        // Per-band bars
        for (const [band, fill] of Object.entries(this._bandFills)) {
          if (bands[band] !== undefined) {
            fill.style.height = `${bands[band] * 100}%`;
          }
        }
      }
      this._animFrame = requestAnimationFrame(update);
    };
    this._animFrame = requestAnimationFrame(update);
  }

  _stopEnergyLoop() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  _applyStyles(panel) {
    const style = document.createElement('style');
    style.textContent = `
      #audio-panel {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 280px;
        background: rgba(0, 0, 0, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        color: #eee;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 12px;
        z-index: 10000;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        user-select: none;
      }
      .ap-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .ap-title {
        font-weight: bold;
        font-size: 13px;
      }
      .ap-status {
        color: #666;
        font-size: 11px;
      }
      .ap-status.ap-active {
        color: #4fc3f7;
      }
      .ap-body {
        padding: 10px 14px;
      }
      .ap-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .ap-btn {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: #ddd;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
        white-space: nowrap;
        transition: background 0.15s;
      }
      .ap-btn:hover {
        background: rgba(255,255,255,0.15);
      }
      .ap-btn-stop {
        background: rgba(255,80,80,0.15);
        border-color: rgba(255,80,80,0.3);
        width: 100%;
      }
      .ap-btn-stop:hover {
        background: rgba(255,80,80,0.25);
      }
      .ap-input {
        flex: 1;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #ccc;
        padding: 5px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-family: inherit;
        min-width: 0;
      }
      .ap-input:focus {
        outline: none;
        border-color: rgba(79,195,247,0.5);
      }
      .ap-filename {
        color: #666;
        font-size: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 120px;
      }
      .ap-energy {
        height: 4px;
        background: rgba(255,255,255,0.08);
        border-radius: 2px;
        overflow: hidden;
        margin: 12px 0 8px;
      }
      .ap-energy-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #4fc3f7, #e040fb);
        border-radius: 2px;
        transition: width 0.05s;
      }
      .ap-bands {
        display: flex;
        gap: 4px;
        height: 40px;
        align-items: flex-end;
      }
      .ap-band {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        position: relative;
      }
      .ap-band-fill {
        width: 100%;
        background: linear-gradient(0deg, #4fc3f7, #e040fb);
        border-radius: 2px 2px 0 0;
        position: absolute;
        bottom: 14px;
        height: 0%;
        max-height: calc(100% - 14px);
        transition: height 0.05s;
      }
      .ap-band span {
        position: absolute;
        bottom: 0;
        font-size: 8px;
        color: #666;
      }
    `;
    document.head.appendChild(style);
  }
}
