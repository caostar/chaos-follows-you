/**
 * HandPanel — Collapsible floating panel for hand tracking controls.
 *
 * Collapsed: shows only a ✋ emoji tab on the left edge.
 * Expanded: shows full hand tracking controls.
 * 'h' key toggles total visibility (hidden/shown) without affecting collapsed state.
 * Clicking the emoji tab toggles collapsed/expanded.
 */
export default class HandPanel {
  constructor(handController) {
    this.controller = handController;
    this.visible = true;     // h key toggles this
    this.expanded = false;   // click emoji toggles this
    this._panel = null;
    this._statusEl = null;
    this._gestureEl = null;
    this._startBtn = null;
    this._animFrame = null;

    this._build();
  }

  /** Toggle total visibility (h key) — does not affect expanded/collapsed */
  toggle() {
    this.visible = !this.visible;
    this._panel.style.display = this.visible ? 'flex' : 'none';
    if (this.visible) {
      this._startStatusLoop();
    } else {
      this._stopStatusLoop();
    }
    console.log(`[HandPanel] ${this.visible ? 'Shown' : 'Hidden'}`);
  }

  show() { if (!this.visible) this.toggle(); }
  hide() { if (this.visible) this.toggle(); }

  destroy() {
    this._stopStatusLoop();
    if (this._panel) { this._panel.remove(); this._panel = null; }
  }

  _toggleExpanded() {
    this.expanded = !this.expanded;
    this._panel.querySelector('.cp-body').style.display = this.expanded ? 'block' : 'none';
    this._panel.querySelector('.cp-tab-label').textContent = this.expanded ? '✋ Hands' : '✋';
  }

  /** Recalculate this panel's top position based on audio panel height */
  _updatePosition() {
    const audioPanel = document.getElementById('audio-panel');
    if (audioPanel && audioPanel.style.display !== 'none') {
      const rect = audioPanel.getBoundingClientRect();
      this._panel.style.top = `${rect.bottom + 8}px`;
    } else {
      this._panel.style.top = '16px';
    }
  }

  _build() {
    const panel = document.createElement('div');
    panel.id = 'hand-panel';
    panel.className = 'cp-panel';
    panel.innerHTML = `
      <div class="cp-tab" data-action="toggle-expand">
        <span class="cp-tab-label">✋</span>
        <span class="cp-tab-status hp-status">off</span>
      </div>
      <div class="cp-body" style="display:none">
        <div class="hp-row">
          <button class="cp-btn cp-btn-start" data-action="toggle-tracking">✋ Start Tracking</button>
        </div>
        <div class="hp-row">
          <button class="cp-btn" data-action="debug">👁 Debug Video</button>
        </div>
        <div class="hp-gesture">
          <span class="hp-gesture-label">gesture:</span>
          <span class="hp-gesture-value">&mdash;</span>
        </div>
        <div class="hp-help">
          <div>☝️ Index finger &rarr; move</div>
          <div>🤏 Pinch &rarr; new shape</div>
          <div>🤲 Two hands spread &rarr; zoom in</div>
          <div>🤲 Two hands close &rarr; zoom out</div>
        </div>
      </div>
    `;

    // AudioPanel already injects shared .cp-* styles
    document.body.appendChild(panel);

    this._panel = panel;
    this._statusEl = panel.querySelector('.hp-status');
    this._gestureEl = panel.querySelector('.hp-gesture-value');
    this._startBtn = panel.querySelector('[data-action="toggle-tracking"]');

    // Collapse/expand on tab click
    panel.querySelector('[data-action="toggle-expand"]').addEventListener('click', () => {
      this._toggleExpanded();
    });

    // Start/stop tracking
    this._startBtn.addEventListener('click', async () => {
      if (this.controller.active) {
        this.controller.stop();
        this._updateStatus('off');
        this._startBtn.textContent = '✋ Start Tracking';
        this._debugBtn.disabled = true;
      } else {
        this._startBtn.textContent = '⏳ Loading model...';
        this._startBtn.disabled = true;
        try {
          await this.controller.start();
          this._updateStatus('tracking');
          this._startBtn.textContent = '⏹ Stop Tracking';
          this._debugBtn.disabled = false;
        } catch (err) {
          this._startBtn.textContent = '✋ Start Tracking';
          this._updateStatus('error');
          this._debugBtn.disabled = true;
        }
        this._startBtn.disabled = false;
      }
    });

    // Debug toggle — only works when tracking is active
    this._debugBtn = panel.querySelector('[data-action="debug"]');
    this._debugBtn.disabled = true;
    this._debugBtn.addEventListener('click', () => {
      if (this.controller.active) {
        this.controller.toggleDebug();
      }
    });

    // Start status loop since panel is visible by default
    this._startStatusLoop();
  }

  _updateStatus(mode) {
    const labels = { tracking: '👁', off: 'off', error: '❌' };
    this._statusEl.textContent = labels[mode] || mode;
    this._statusEl.className = `cp-tab-status hp-status ${mode === 'tracking' ? 'hp-active' : ''}`;
  }

  _startStatusLoop() {
    const update = () => {
      if (!this.visible) return;
      if (this.controller.active) {
        const gesture = this.controller._lastGesture;
        const gestureLabels = { point: '☝️ pointing', 'two-hands': '🤲 two hands' };
        this._gestureEl.textContent = gestureLabels[gesture] || '☝️ pointing';
      } else {
        this._gestureEl.textContent = '—';
      }
      this._updatePosition();
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
}
