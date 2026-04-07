/**
 * HandPanel — Floating DOM overlay for hand tracking controls.
 *
 * Toggled with the 'h' key. Shows status, start/stop button,
 * and debug toggle.
 */
export default class HandPanel {
  constructor(handController) {
    this.controller = handController;
    this.visible = false;
    this._panel = null;
    this._statusEl = null;
    this._gestureEl = null;
    this._startBtn = null;
    this._animFrame = null;

    this._build();
  }

  toggle() {
    this.visible = !this.visible;
    this._panel.style.display = this.visible ? 'block' : 'none';
    if (this.visible) {
      this._startStatusLoop();
    } else {
      this._stopStatusLoop();
    }
    console.log(`[HandPanel] ${this.visible ? 'Shown' : 'Hidden'}`);
  }

  show() {
    if (!this.visible) this.toggle();
  }

  hide() {
    if (this.visible) this.toggle();
  }

  destroy() {
    this._stopStatusLoop();
    if (this._panel) {
      this._panel.remove();
      this._panel = null;
    }
  }

  _build() {
    const panel = document.createElement('div');
    panel.id = 'hand-panel';
    panel.innerHTML = `
      <div class="hp-header">
        <span class="hp-title">✋ Hands</span>
        <span class="hp-status">off</span>
      </div>
      <div class="hp-body">
        <div class="hp-row">
          <button class="hp-btn hp-btn-start" data-action="toggle">✋ Start Tracking</button>
        </div>
        <div class="hp-row">
          <button class="hp-btn" data-action="debug">👁 Debug Video</button>
        </div>
        <div class="hp-gesture">
          <span class="hp-gesture-label">gesture:</span>
          <span class="hp-gesture-value">—</span>
        </div>
        <div class="hp-help">
          <div>☝️ Index finger → move</div>
          <div>🤏 Pinch → new shape</div>
          <div>🖐️ Open hand → zoom in</div>
          <div>✊ Fist → zoom out</div>
        </div>
      </div>
    `;

    this._applyStyles(panel);
    document.body.appendChild(panel);
    panel.style.display = 'none';

    this._panel = panel;
    this._statusEl = panel.querySelector('.hp-status');
    this._gestureEl = panel.querySelector('.hp-gesture-value');
    this._startBtn = panel.querySelector('[data-action="toggle"]');

    // Wire up buttons
    this._startBtn.addEventListener('click', async () => {
      if (this.controller.active) {
        this.controller.stop();
        this._updateStatus('off');
        this._startBtn.textContent = '✋ Start Tracking';
      } else {
        this._startBtn.textContent = '⏳ Loading model...';
        this._startBtn.disabled = true;
        try {
          await this.controller.start();
          this._updateStatus('tracking');
          this._startBtn.textContent = '⏹ Stop Tracking';
        } catch (err) {
          this._startBtn.textContent = '✋ Start Tracking';
          this._updateStatus('error');
        }
        this._startBtn.disabled = false;
      }
    });

    panel.querySelector('[data-action="debug"]').addEventListener('click', () => {
      this.controller.toggleDebug();
    });
  }

  _updateStatus(mode) {
    const labels = { tracking: '👁 tracking', off: 'off', error: '❌ error' };
    this._statusEl.textContent = labels[mode] || mode;
    this._statusEl.className = `hp-status ${mode === 'tracking' ? 'hp-active' : ''}`;
  }

  _startStatusLoop() {
    const update = () => {
      if (!this.visible) return;
      if (this.controller.active) {
        const gesture = this.controller._lastGesture;
        const gestureLabels = { open: '🖐️ open', fist: '✊ fist' };
        this._gestureEl.textContent = gestureLabels[gesture] || '☝️ pointing';
      } else {
        this._gestureEl.textContent = '—';
      }
      this._animFrame = requestAnimationFrame(update);
    };
    this._animFrame = requestAnimationFrame(update);
  }

  _stopStatusLoop() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  _applyStyles(panel) {
    // Check if styles already added (avoid duplicates)
    if (document.getElementById('hand-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'hand-panel-styles';
    style.textContent = `
      #hand-panel {
        position: fixed;
        top: 16px;
        left: 16px;
        width: 220px;
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
      .hp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .hp-title {
        font-weight: bold;
        font-size: 13px;
      }
      .hp-status {
        color: #666;
        font-size: 11px;
      }
      .hp-status.hp-active {
        color: #81c784;
      }
      .hp-body {
        padding: 10px 14px;
      }
      .hp-row {
        margin-bottom: 8px;
      }
      .hp-btn {
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
        width: 100%;
      }
      .hp-btn:hover {
        background: rgba(255,255,255,0.15);
      }
      .hp-btn:disabled {
        opacity: 0.5;
        cursor: wait;
      }
      .hp-btn-start {
        background: rgba(129,199,132,0.15);
        border-color: rgba(129,199,132,0.3);
      }
      .hp-btn-start:hover {
        background: rgba(129,199,132,0.25);
      }
      .hp-gesture {
        display: flex;
        gap: 6px;
        align-items: center;
        margin: 10px 0 8px;
        padding: 6px 0;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .hp-gesture-label {
        color: #666;
        font-size: 10px;
      }
      .hp-gesture-value {
        color: #81c784;
        font-size: 12px;
      }
      .hp-help {
        font-size: 10px;
        color: #888;
        line-height: 1.6;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
    `;
    document.head.appendChild(style);
  }
}
