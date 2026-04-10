/**
 * WelcomeModal — Greeting screen shown on first load.
 *
 * Introduces the project, shows 3 quick-start buttons (Stream, Hand Tracking,
 * Random Mode), lists mouse interactions and keyboard shortcuts.
 * Dismissed by clicking a button, pressing any key, or clicking the close button.
 */
export default class WelcomeModal {
  /**
   * @param {object} callbacks - { onStream, onHand, onRandom }
   */
  constructor(callbacks) {
    this._callbacks = callbacks;
    this._overlay = null;
    this._dismissed = false;
    this._build();
  }

  dismiss() {
    if (this._dismissed) return;
    this._dismissed = true;
    this._overlay.style.opacity = '0';
    setTimeout(() => {
      this._overlay.remove();
      this._overlay = null;
    }, 400);
    document.removeEventListener('keydown', this._onKey);
  }

  _build() {
    const overlay = document.createElement('div');
    overlay.id = 'welcome-modal';
    overlay.innerHTML = `
      <div class="wm-card">
        <button class="wm-close" aria-label="Close">&times;</button>
        <h1 class="wm-title">Chaos Follows You</h1>
        <p class="wm-subtitle">Interactive generative art &mdash; procedural chaos stars that react to your mouse, sound, and hands.</p>

        <div class="wm-actions">
          <button class="wm-btn wm-btn-stream" data-action="stream">
            <span class="wm-btn-icon">🔊</span>
            <span class="wm-btn-label">Stream</span>
            <span class="wm-btn-desc">React to dark electronic radio</span>
          </button>
          <button class="wm-btn wm-btn-hand" data-action="hand">
            <span class="wm-btn-icon">✋</span>
            <span class="wm-btn-label">Hand Tracking</span>
            <span class="wm-btn-desc">Control with your webcam</span>
          </button>
          <button class="wm-btn wm-btn-random" data-action="random">
            <span class="wm-btn-icon">🎲</span>
            <span class="wm-btn-label">Random Mode</span>
            <span class="wm-btn-desc">Sit back and watch</span>
          </button>
        </div>

        <div class="wm-divider"></div>

        <div class="wm-sections">
          <div class="wm-section">
            <h3>Mouse</h3>
            <div class="wm-keys">
              <div class="wm-key-row"><kbd>Move</kbd><span>Guide the particle emitter</span></div>
              <div class="wm-key-row"><kbd>Click</kbd><span>New chaos star shape</span></div>
              <div class="wm-key-row"><kbd>Scroll</kbd><span>Zoom in/out</span></div>
              <div class="wm-key-row"><kbd>Drag</kbd><span>Pan the viewport</span></div>
            </div>
          </div>
          <div class="wm-section">
            <h3>Keyboard</h3>
            <div class="wm-keys">
              <div class="wm-key-row"><kbd>Space</kbd><span>New chaos star</span></div>
              <div class="wm-key-row"><kbd>R</kbd><span>Random move</span></div>
              <div class="wm-key-row"><kbd>Z / X</kbd><span>Zoom in / out</span></div>
              <div class="wm-key-row"><kbd>Arrows</kbd><span>Move directionally</span></div>
              <div class="wm-key-row"><kbd>A</kbd><span>Toggle random mode</span></div>
              <div class="wm-key-row"><kbd>M</kbd><span>Toggle audio panel</span></div>
              <div class="wm-key-row"><kbd>H</kbd><span>Toggle hand panel</span></div>
              <div class="wm-key-row"><kbd>G</kbd><span>Toggle controls panel</span></div>
              <div class="wm-key-row"><kbd>D</kbd><span>Toggle debug video</span></div>
            </div>
          </div>
        </div>

        <div class="wm-featured">
          <div class="wm-feat"><kbd>Q</kbd> Hide/show all UI for clean visuals</div>
          <div class="wm-feat"><kbd>F</kbd> Toggle fullscreen</div>
        </div>

        <p class="wm-footer">Click any button above, press a key, or just start moving your mouse &mdash; then play with controls on your top left.</p>

        <div class="wm-links">
          <p>This is an open source project. Code: <a href="https://github.com/caostar/chaos-follows-you" target="_blank" rel="noopener">github.com/caostar/chaos-follows-you</a></p>
          <p>All concept and magic explained: <a href="https://caostar.com/thoughts/chaos-follows-you/2026/04/" target="_blank" rel="noopener">caostar.com/thoughts/chaos-follows-you</a></p>
        </div>
      </div>
    `;

    this._applyStyles();
    document.body.appendChild(overlay);
    this._overlay = overlay;

    // Wire buttons
    overlay.querySelector('[data-action="stream"]').addEventListener('click', () => {
      this.dismiss();
      this._callbacks.onStream?.();
    });
    overlay.querySelector('[data-action="hand"]').addEventListener('click', () => {
      this.dismiss();
      this._callbacks.onHand?.();
    });
    overlay.querySelector('[data-action="random"]').addEventListener('click', () => {
      this.dismiss();
      this._callbacks.onRandom?.();
    });
    overlay.querySelector('.wm-close').addEventListener('click', () => {
      this.dismiss();
    });

    // Dismiss on any key press
    this._onKey = () => this.dismiss();
    document.addEventListener('keydown', this._onKey);

    // Dismiss on click outside the card
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.dismiss();
    });

    // Fade in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }

  _applyStyles() {
    if (document.getElementById('welcome-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'welcome-modal-styles';
    style.textContent = `
      #welcome-modal {
        position: fixed; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.7);
        z-index: 50000;
        opacity: 0;
        transition: opacity 0.4s ease;
        backdrop-filter: blur(8px);
      }
      .wm-card {
        position: relative;
        background: rgba(10,10,15,0.95);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        padding: 32px 36px;
        max-width: 520px;
        width: calc(100vw - 40px);
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        color: #ddd;
        font-family: 'SF Mono', 'Fira Code', monospace;
        box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
      }
      .wm-close {
        position: absolute; top: 12px; right: 16px;
        background: none; border: none; color: #666;
        font-size: 24px; cursor: pointer; padding: 4px 8px;
        line-height: 1; transition: color 0.15s;
      }
      .wm-close:hover { color: #eee; }
      .wm-title {
        font-size: 22px; font-weight: bold; color: #fff;
        margin: 0 0 6px;
      }
      .wm-subtitle {
        font-size: 12px; color: #888; margin: 0 0 20px;
        line-height: 1.5;
      }

      /* Action buttons */
      .wm-actions {
        display: flex; gap: 10px; margin-bottom: 20px;
      }
      .wm-btn {
        flex: 1;
        display: flex; flex-direction: column; align-items: center;
        gap: 4px; padding: 14px 8px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        color: #ddd; cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      }
      .wm-btn:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.25);
        transform: translateY(-2px);
      }
      .wm-btn-icon { font-size: 24px; }
      .wm-btn-label { font-size: 12px; font-weight: bold; color: #eee; }
      .wm-btn-desc { font-size: 9px; color: #666; text-align: center; }

      .wm-btn-stream:hover { border-color: rgba(79,195,247,0.4); }
      .wm-btn-hand:hover { border-color: rgba(129,199,132,0.4); }
      .wm-btn-random:hover { border-color: rgba(255,183,77,0.4); }

      .wm-divider {
        height: 1px;
        background: rgba(255,255,255,0.08);
        margin: 0 0 16px;
      }

      /* Sections */
      .wm-sections {
        display: flex; gap: 20px; margin-bottom: 16px;
      }
      .wm-section { flex: 1; }
      .wm-section h3 {
        font-size: 11px; color: #888; margin: 0 0 8px;
        text-transform: uppercase; letter-spacing: 1px;
      }
      .wm-keys {
        display: flex; flex-direction: column; gap: 4px;
      }
      .wm-key-row {
        display: flex; align-items: center; gap: 8px;
        font-size: 11px;
      }
      .wm-key-row kbd {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 10px; font-family: inherit;
        color: #4fc3f7;
        min-width: 48px; text-align: center;
      }
      .wm-key-row span { color: #999; }

      /* Featured keys */
      .wm-featured {
        display: flex; gap: 16px; margin-bottom: 16px;
      }
      .wm-feat {
        flex: 1;
        background: rgba(79,195,247,0.06);
        border: 1px solid rgba(79,195,247,0.15);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 11px; color: #aaa;
        text-align: center;
      }
      .wm-feat kbd {
        background: rgba(79,195,247,0.15);
        border: 1px solid rgba(79,195,247,0.3);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 11px; font-family: inherit;
        color: #4fc3f7;
      }

      .wm-footer {
        font-size: 10px; color: #555;
        text-align: center; margin: 0 0 12px;
      }
      .wm-links {
        border-top: 1px solid rgba(255,255,255,0.06);
        padding-top: 12px;
      }
      .wm-links p {
        font-size: 10px; color: #666;
        margin: 0 0 6px; text-align: center;
      }
      .wm-links a {
        color: #4fc3f7; text-decoration: none;
        transition: color 0.15s;
      }
      .wm-links a:hover { color: #81d4fa; }

      /* Mobile */
      @media (max-width: 600px) {
        .wm-card {
          padding: 20px 18px;
          border-radius: 12px;
          max-height: calc(100vh - 24px);
          max-height: calc(100dvh - 24px);
        }
        .wm-title { font-size: 18px; }
        .wm-subtitle { font-size: 12px; margin-bottom: 14px; }
        .wm-actions {
          flex-direction: column; gap: 8px;
          margin-bottom: 14px;
        }
        .wm-btn {
          flex-direction: row; gap: 10px;
          padding: 12px 16px; align-items: center;
        }
        .wm-btn-icon { font-size: 22px; }
        .wm-btn-label { font-size: 14px; }
        .wm-btn-desc { font-size: 11px; text-align: left; }
        .wm-divider { margin-bottom: 10px; }
        /* Hide keyboard section on mobile — too much space, users can find G key later */
        .wm-sections .wm-section:last-child { display: none; }
        .wm-sections {
          flex-direction: column; gap: 8px;
          margin-bottom: 10px;
        }
        .wm-key-row { font-size: 12px; gap: 6px; }
        .wm-key-row kbd { font-size: 11px; min-width: 44px; padding: 3px 6px; }
        .wm-key-row span { font-size: 11px; }
        .wm-section h3 { font-size: 10px; margin-bottom: 6px; }
        .wm-featured {
          flex-direction: column; gap: 6px;
          margin-bottom: 12px;
        }
        .wm-feat { font-size: 12px; padding: 10px; }
        .wm-feat kbd { font-size: 12px; }
        .wm-footer { font-size: 11px; margin-bottom: 10px; }
        .wm-links p { font-size: 11px; }
        .wm-links a { word-break: break-all; }
        .wm-close { top: 8px; right: 10px; font-size: 28px; }
      }

      /* Very small screens */
      @media (max-width: 360px) {
        .wm-card { padding: 16px 14px; }
        .wm-title { font-size: 16px; }
        .wm-sections .wm-section { display: none; }
        .wm-featured { display: none; }
      }
    `;
    document.head.appendChild(style);
  }
}
