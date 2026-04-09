/**
 * AudioPanel — Collapsible floating panel for audio input controls.
 *
 * Collapsed: shows only a 🔊 emoji tab on the left edge.
 * Expanded: shows full audio controls.
 * 'm' key toggles total visibility (hidden/shown) without affecting collapsed state.
 * Clicking the emoji tab toggles collapsed/expanded.
 */
import RADIO_STREAMS from './radioStreams.js';

export default class AudioPanel {
  constructor(audioController) {
    this.controller = audioController;
    this.visible = true;     // m key toggles this
    this.expanded = false;   // click emoji toggles this
    this._panel = null;
    this._statusEl = null;
    this._energyBar = null;
    this._streamUrlInput = null;
    this._animFrame = null;

    this._build();
  }

  /** Toggle total visibility (m key) — does not affect expanded/collapsed */
  toggle() {
    this.visible = !this.visible;
    this._panel.style.display = this.visible ? 'flex' : 'none';
    if (this.visible) {
      this._startEnergyLoop();
    } else {
      this._stopEnergyLoop();
    }
    console.log(`[AudioPanel] ${this.visible ? 'Shown' : 'Hidden'}`);
  }

  show() { if (!this.visible) this.toggle(); }
  hide() { if (this.visible) this.toggle(); }

  destroy() {
    this._stopEnergyLoop();
    if (this._panel) { this._panel.remove(); this._panel = null; }
  }

  _toggleExpanded() {
    this.expanded = !this.expanded;
    this._panel.querySelector('.cp-body').style.display = this.expanded ? 'block' : 'none';
    this._panel.querySelector('.cp-tab-label').textContent = this.expanded ? '🔊 Audio' : '🔊';
  }

  _build() {
    const panel = document.createElement('div');
    panel.id = 'audio-panel';
    panel.className = 'cp-panel';
    panel.innerHTML = `
      <div class="cp-tab" data-action="toggle-expand">
        <span class="cp-tab-label">🔊</span>
        <span class="cp-tab-status ap-status">off</span>
      </div>
      <div class="cp-body" style="display:none">
        <div class="ap-row ap-stream-row">
          <button class="cp-btn" data-action="stream">▶ Stream</button>
          <select class="ap-stream-select"></select>
        </div>
        <div class="ap-row ap-custom-url" style="display:none">
          <input type="text" class="cp-input" placeholder="paste stream URL" value="">
        </div>
        <div class="ap-row">
          <button class="cp-btn" data-action="file">📁 File</button>
          <input type="file" class="ap-file-input" accept="audio/*" style="display:none">
          <span class="ap-filename">no file</span>
        </div>
        <div class="ap-row">
          <button class="cp-btn" data-action="mic">🎤 Mic</button>
        </div>
        <div class="ap-row">
          <button class="cp-btn cp-btn-stop" data-action="stop">⏹ Stop</button>
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

    this._applyStyles();
    document.body.appendChild(panel);

    this._panel = panel;
    this._statusEl = panel.querySelector('.ap-status');
    this._energyBar = panel.querySelector('.ap-energy-bar');
    this._bandFills = {};
    panel.querySelectorAll('.ap-band').forEach((el) => {
      this._bandFills[el.dataset.band] = el.querySelector('.ap-band-fill');
    });

    // Populate stream dropdown
    this._streamSelect = panel.querySelector('.ap-stream-select');
    this._customUrlInput = panel.querySelector('.cp-input');
    this._customUrlRow = panel.querySelector('.ap-custom-url');
    for (const stream of RADIO_STREAMS) {
      const opt = document.createElement('option');
      opt.value = stream.url;
      opt.textContent = stream.label;
      this._streamSelect.appendChild(opt);
    }
    this._streamSelect.addEventListener('change', () => {
      if (this._streamSelect.value === 'custom') {
        this._customUrlRow.style.display = 'flex';
        this._customUrlInput.focus();
      } else {
        this._customUrlRow.style.display = 'none';
        // Auto-play on selection
        this._playStream(this._streamSelect.value);
      }
    });

    // Collapse/expand on tab click
    panel.querySelector('[data-action="toggle-expand"]').addEventListener('click', () => {
      this._toggleExpanded();
    });

    // Wire up buttons — stream button plays custom URL or re-plays selected stream
    panel.querySelector('[data-action="stream"]').addEventListener('click', () => {
      let url;
      if (this._streamSelect.value === 'custom') {
        url = this._customUrlInput.value.trim();
      } else {
        url = this._streamSelect.value;
      }
      if (url) this._playStream(url);
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

    // Prevent keyboard shortcuts when typing in custom URL input
    this._customUrlInput.addEventListener('keydown', (e) => e.stopPropagation());
    this._customUrlInput.addEventListener('keyup', (e) => e.stopPropagation());
    this._customUrlInput.addEventListener('keypress', (e) => e.stopPropagation());

    // Start energy loop since panel is visible by default
    this._startEnergyLoop();
  }

  _updateStatus(mode) {
    const labels = { stream: '📡', file: '🎵', mic: '🎤', off: 'off' };
    this._statusEl.textContent = labels[mode] || mode;
    this._statusEl.className = `cp-tab-status ap-status ${mode !== 'off' ? 'ap-active' : ''}`;
  }

  _startEnergyLoop() {
    const update = () => {
      if (!this.visible) return;
      const bands = this.controller.getBands();
      if (bands) {
        this._energyBar.style.width = `${bands.energy * 100}%`;
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

  async _playStream(url) {
    try {
      await this.controller.start('stream', url);
      this._updateStatus('stream');
    } catch (err) {
      console.error('[AudioPanel] Stream failed:', err);
      this._updateStatus('off');
      // Show a non-blocking notification instead of alert
      this._showError(`Stream failed to load. It may be offline or blocked by CORS.`);
    }
  }

  _showError(msg) {
    let toast = document.getElementById('ap-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ap-toast';
      toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(255,60,60,0.9); color: #fff; padding: 10px 20px;
        border-radius: 8px; font-size: 12px; font-family: inherit;
        z-index: 30000; pointer-events: none; opacity: 0;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 4000);
  }

  _stopEnergyLoop() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  _applyStyles() {
    if (document.getElementById('control-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'control-panel-styles';
    style.textContent = `
      /* --- Shared control panel styles --- */
      .cp-panel {
        position: fixed;
        left: 16px;
        display: flex;
        flex-direction: column;
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
        min-width: 44px;
        transition: width 0.2s ease;
      }
      #audio-panel { top: 16px; }
      #hand-panel  { top: 76px; }

      .cp-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        cursor: pointer;
        border-bottom: 1px solid transparent;
        transition: border-color 0.15s;
      }
      .cp-tab:hover {
        background: rgba(255,255,255,0.04);
        border-radius: 12px 12px 0 0;
      }
      .cp-panel:has(.cp-body[style*="display: none"]) .cp-tab,
      .cp-panel:has(.cp-body[style*="display:none"]) .cp-tab {
        border-radius: 12px;
      }
      .cp-panel:has(.cp-body[style*="block"]) .cp-tab {
        border-bottom-color: rgba(255,255,255,0.1);
      }
      .cp-tab-label {
        font-weight: bold;
        font-size: 15px;
      }
      .cp-tab-status {
        color: #666;
        font-size: 11px;
        margin-left: auto;
      }
      .cp-tab-status.ap-active { color: #4fc3f7; }
      .cp-tab-status.hp-active { color: #81c784; }

      .cp-body {
        padding: 10px 14px;
        width: 260px;
      }

      .cp-btn {
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
      .cp-btn:hover { background: rgba(255,255,255,0.15); }
      .cp-btn:disabled { opacity: 0.5; cursor: wait; }
      .cp-btn-stop {
        background: rgba(255,80,80,0.15);
        border-color: rgba(255,80,80,0.3);
        width: 100%;
      }
      .cp-btn-stop:hover { background: rgba(255,80,80,0.25); }
      .cp-btn-start {
        background: rgba(129,199,132,0.15);
        border-color: rgba(129,199,132,0.3);
        width: 100%;
      }
      .cp-btn-start:hover { background: rgba(129,199,132,0.25); }

      .cp-input {
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
      .cp-input:focus {
        outline: none;
        border-color: rgba(79,195,247,0.5);
      }

      /* --- Audio-specific --- */
      .ap-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .ap-filename {
        color: #666; font-size: 10px;
        overflow: hidden; text-overflow: ellipsis;
        white-space: nowrap; max-width: 120px;
      }
      .ap-stream-select {
        flex: 1;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #ccc;
        padding: 5px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-family: inherit;
        min-width: 0;
      }
      .ap-stream-select:focus {
        outline: none;
        border-color: rgba(79,195,247,0.5);
      }
      .ap-stream-row { flex-wrap: nowrap; }
      .ap-custom-url { margin-top: -4px; }
      .ap-energy {
        height: 4px;
        background: rgba(255,255,255,0.08);
        border-radius: 2px; overflow: hidden;
        margin: 12px 0 8px;
      }
      .ap-energy-bar {
        height: 100%; width: 0%;
        background: linear-gradient(90deg, #4fc3f7, #e040fb);
        border-radius: 2px; transition: width 0.05s;
      }
      .ap-bands {
        display: flex; gap: 4px; height: 40px;
        align-items: flex-end;
      }
      .ap-band {
        flex: 1; display: flex; flex-direction: column;
        align-items: center; height: 100%; position: relative;
      }
      .ap-band-fill {
        width: 100%;
        background: linear-gradient(0deg, #4fc3f7, #e040fb);
        border-radius: 2px 2px 0 0;
        position: absolute; bottom: 14px;
        height: 0%; max-height: calc(100% - 14px);
        transition: height 0.05s;
      }
      .ap-band span {
        position: absolute; bottom: 0;
        font-size: 8px; color: #666;
      }

      /* --- Hand-specific --- */
      .hp-row { margin-bottom: 8px; }
      .hp-gesture {
        display: flex; gap: 6px; align-items: center;
        margin: 10px 0 8px; padding: 6px 0;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .hp-gesture-label { color: #666; font-size: 10px; }
      .hp-gesture-value { color: #81c784; font-size: 12px; }
      .hp-help {
        font-size: 10px; color: #888;
        line-height: 1.6; padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }

      /* --- Mobile responsive --- */
      @media (max-width: 600px) {
        .cp-panel {
          left: 8px;
          font-size: 14px;
          border-radius: 10px;
        }
        #audio-panel { top: 8px; }
        .cp-tab {
          padding: 12px 16px;
          gap: 10px;
        }
        .cp-tab-label {
          font-size: 20px;
        }
        .cp-tab-status {
          font-size: 14px;
        }
        .cp-body {
          padding: 12px 16px;
          width: calc(100vw - 40px);
          max-width: 340px;
        }
        .cp-btn {
          padding: 10px 16px;
          font-size: 14px;
          border-radius: 8px;
        }
        .cp-btn-stop, .cp-btn-start {
          padding: 12px 16px;
          font-size: 15px;
        }
        .cp-input {
          padding: 8px 10px;
          font-size: 14px;
          border-radius: 6px;
        }
        .ap-row {
          gap: 8px;
          margin-bottom: 10px;
        }
        .ap-stream-select {
          padding: 8px 10px;
          font-size: 13px;
          border-radius: 6px;
        }
        .ap-filename {
          font-size: 12px;
          max-width: 160px;
        }
        .ap-energy {
          height: 6px;
          margin: 14px 0 10px;
        }
        .ap-bands {
          height: 50px;
          gap: 6px;
        }
        .ap-band span {
          font-size: 10px;
        }
        .hp-row { margin-bottom: 10px; }
        .hp-gesture {
          margin: 12px 0 10px;
          padding: 8px 0;
        }
        .hp-gesture-label { font-size: 13px; }
        .hp-gesture-value { font-size: 15px; }
        .hp-help {
          font-size: 13px;
          line-height: 1.8;
          padding-top: 8px;
        }
      }

      @media (max-width: 600px) and (max-height: 700px) {
        /* Small phone landscape — keep panels compact */
        .cp-body {
          max-width: 280px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
