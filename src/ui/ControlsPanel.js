/**
 * ControlsPanel — Collapsible panel for editing all controller parameters live.
 *
 * Toggle with 'g' key. Contains tabs for Random, Audio, Hand configs
 * plus presets, save/load, and keyboard shortcuts.
 */
import ConfigSection from './ConfigSection.js';
import {
  RANDOM_SCHEMA, AUDIO_SCHEMA, HAND_SCHEMA,
  RANDOM_PRESETS, AUDIO_PRESETS, HAND_PRESETS,
  KEYBOARD_SHORTCUTS,
  getNestedValue, setNestedValue,
} from './controlSchemas.js';

const STORAGE_KEY = 'chaos-saved-configs';

export default class ControlsPanel {
  constructor(controllers) {
    this.controllers = controllers; // { random, audio, hand }
    this.visible = true;
    this.expanded = false;
    this._panel = null;
    this._sections = {};
    this._activeTab = 'random';

    this._build();
  }

  toggle() {
    this.visible = !this.visible;
    this._panel.style.display = this.visible ? 'flex' : 'none';
    console.log(`[ControlsPanel] ${this.visible ? 'Shown' : 'Hidden'}`);
  }

  show() { if (!this.visible) this.toggle(); }
  hide() { if (this.visible) this.toggle(); }

  _toggleExpanded() {
    this.expanded = !this.expanded;
    this._panel.querySelector('.cp-body').style.display = this.expanded ? 'block' : 'none';
    this._panel.querySelector('.cp-tab-label').textContent = this.expanded ? '⚙ Controls' : '⚙';
  }

  _build() {
    const panel = document.createElement('div');
    panel.id = 'controls-panel';
    panel.className = 'cp-panel';
    panel.innerHTML = `
      <div class="cp-tab" data-action="toggle-expand">
        <span class="cp-tab-label">⚙</span>
      </div>
      <div class="cp-body" style="display:none">
        <div class="ctrl-tabs">
          <button class="ctrl-tab active" data-tab="random">Random</button>
          <button class="ctrl-tab" data-tab="audio">Audio</button>
          <button class="ctrl-tab" data-tab="hand">Hand</button>
          <button class="ctrl-tab" data-tab="keys">Keys</button>
        </div>
        <div class="ctrl-preset-bar">
          <select class="ctrl-preset-select"></select>
          <button class="ctrl-preset-btn" data-action="save-config" title="Save current config">💾</button>
          <button class="ctrl-preset-btn" data-action="delete-config" title="Delete saved config">🗑</button>
        </div>
        <div class="ctrl-content"></div>
      </div>
    `;

    this._applyStyles();
    document.body.appendChild(panel);
    this._panel = panel;

    // Collapse/expand
    panel.querySelector('[data-action="toggle-expand"]').addEventListener('click', () => {
      this._toggleExpanded();
    });

    // Tab switching
    panel.querySelectorAll('.ctrl-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._switchTab(btn.dataset.tab);
      });
    });

    // Preset select
    this._presetSelect = panel.querySelector('.ctrl-preset-select');
    this._presetSelect.addEventListener('change', () => {
      this._applyPreset(this._presetSelect.value);
    });

    // Save button
    panel.querySelector('[data-action="save-config"]').addEventListener('click', () => {
      this._saveConfig();
    });

    // Delete button
    panel.querySelector('[data-action="delete-config"]').addEventListener('click', () => {
      this._deleteConfig();
    });

    this._contentEl = panel.querySelector('.ctrl-content');

    // Shared tooltip element
    this._tooltip = document.createElement('div');
    this._tooltip.id = 'cs-tooltip';
    this._tooltip.style.cssText = `
      position: fixed; display: none; max-width: 220px; padding: 8px 10px;
      background: rgba(0,0,0,0.95); border: 1px solid rgba(255,255,255,0.25);
      border-radius: 6px; color: #ddd; font-size: 10px; line-height: 1.5;
      z-index: 30000; pointer-events: none; font-family: inherit;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(this._tooltip);

    // Delegate hover events for all .cs-info elements
    panel.addEventListener('mouseover', (e) => {
      const info = e.target.closest('.cs-info');
      if (!info) return;
      const tip = info.getAttribute('data-tip');
      if (!tip) return;
      const rect = info.getBoundingClientRect();
      this._tooltip.textContent = tip;
      this._tooltip.style.display = 'block';
      // Position to the right of the icon, or left if near right edge
      let left = rect.right + 8;
      if (left + 230 > window.innerWidth) {
        left = rect.left - 230;
      }
      let top = rect.top - 4;
      if (top + 80 > window.innerHeight) {
        top = window.innerHeight - 80;
      }
      this._tooltip.style.left = `${left}px`;
      this._tooltip.style.top = `${top}px`;
    });
    panel.addEventListener('mouseout', (e) => {
      if (e.target.closest('.cs-info')) {
        this._tooltip.style.display = 'none';
      }
    });

    // Build all tab contents
    this._buildTab('random', RANDOM_SCHEMA, this.controllers.random.config);
    this._buildTab('audio', AUDIO_SCHEMA, this.controllers.audio.config);
    this._buildTab('hand', HAND_SCHEMA, this.controllers.hand.config);
    this._buildKeysTab();

    // Show default tab
    this._switchTab('random');

    // Dynamic positioning loop
    this._posLoop = () => {
      if (this.visible) this._updatePosition();
      requestAnimationFrame(this._posLoop);
    };
    requestAnimationFrame(this._posLoop);
  }

  _updatePosition() {
    const handPanel = document.getElementById('hand-panel');
    if (handPanel && handPanel.style.display !== 'none') {
      const rect = handPanel.getBoundingClientRect();
      this._panel.style.top = `${rect.bottom + 8}px`;
      const maxH = window.innerHeight - rect.bottom - 24;
      this._panel.querySelector('.cp-body').style.maxHeight = `${maxH}px`;
    } else {
      const audioPanel = document.getElementById('audio-panel');
      if (audioPanel && audioPanel.style.display !== 'none') {
        const rect = audioPanel.getBoundingClientRect();
        this._panel.style.top = `${rect.bottom + 8}px`;
      } else {
        this._panel.style.top = '16px';
      }
    }
  }

  _buildTab(name, schema, config) {
    const container = document.createElement('div');
    container.className = 'ctrl-tab-content';
    container.dataset.tab = name;
    container.style.display = 'none';
    this._contentEl.appendChild(container);

    const section = new ConfigSection(schema, config, container);
    this._sections[name] = { section, config, schema };
  }

  _buildKeysTab() {
    const container = document.createElement('div');
    container.className = 'ctrl-tab-content';
    container.dataset.tab = 'keys';
    container.style.display = 'none';

    let html = '<div class="ctrl-keys">';
    for (const { key, desc } of KEYBOARD_SHORTCUTS) {
      html += `<div class="ctrl-key-row"><kbd>${key}</kbd><span>${desc}</span></div>`;
    }
    html += '</div>';
    container.innerHTML = html;

    this._contentEl.appendChild(container);
  }

  _switchTab(tab) {
    this._activeTab = tab;

    // Update tab buttons
    this._panel.querySelectorAll('.ctrl-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Show/hide content
    this._panel.querySelectorAll('.ctrl-tab-content').forEach((el) => {
      el.style.display = el.dataset.tab === tab ? 'block' : 'none';
    });

    // Show/hide preset bar (not for keys tab)
    const presetBar = this._panel.querySelector('.ctrl-preset-bar');
    presetBar.style.display = tab === 'keys' ? 'none' : 'flex';

    // Update preset dropdown
    if (tab !== 'keys') {
      this._populatePresets(tab);
    }
  }

  _populatePresets(tab) {
    const presets = { random: RANDOM_PRESETS, audio: AUDIO_PRESETS, hand: HAND_PRESETS }[tab];
    const saved = this._getSavedConfigs(tab);

    let html = '';
    for (const name of Object.keys(presets)) {
      html += `<option value="preset:${name}">${name}</option>`;
    }
    if (saved.length > 0) {
      html += '<option disabled>── Saved ──</option>';
      for (const name of saved) {
        html += `<option value="saved:${name}">💾 ${name}</option>`;
      }
    }

    this._presetSelect.innerHTML = html;
  }

  _applyPreset(value) {
    const [type, name] = value.split(':');
    const tab = this._activeTab;
    const { section, config } = this._sections[tab];

    let presetValues;
    if (type === 'preset') {
      const presets = { random: RANDOM_PRESETS, audio: AUDIO_PRESETS, hand: HAND_PRESETS }[tab];
      presetValues = presets[name];
      if (presetValues === null) {
        // "Default" — reload from JSON
        this._reloadDefaultConfig(tab);
        return;
      }
    } else if (type === 'saved') {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      presetValues = all[`${tab}:${name}`];
    }

    if (!presetValues) return;

    // Apply flattened preset values to config
    for (const [path, val] of Object.entries(presetValues)) {
      setNestedValue(config, path, val);
    }
    section.refresh();
    console.log(`[Controls] Applied preset "${name}" to ${tab}`);
  }

  async _reloadDefaultConfig(tab) {
    const urls = {
      random: 'randomControls.json',
      audio: 'audioControls.json',
      hand: 'handControls.json',
    };
    try {
      const resp = await fetch(`${import.meta.env.BASE_URL}${urls[tab]}`);
      if (resp.ok) {
        const json = await resp.json();
        const { section, config } = this._sections[tab];
        // Deep copy json into existing config (preserving the same object reference)
        this._deepAssign(config, json);
        section.refresh();
        console.log(`[Controls] Reloaded default config for ${tab}`);
      }
    } catch (err) {
      console.warn('[Controls] Failed to reload default:', err);
    }
  }

  _deepAssign(target, source) {
    for (const key of Object.keys(source)) {
      if (key.startsWith('_')) continue; // Skip _comment fields
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this._deepAssign(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  _saveConfig() {
    const name = prompt('Name for this configuration:');
    if (!name) return;

    const tab = this._activeTab;
    const { config, schema } = this._sections[tab];

    // Flatten config to dot-path values for the fields in schema
    const flat = {};
    for (const field of schema.fields) {
      const val = getNestedValue(config, field.key);
      if (val !== undefined) flat[field.key] = val;
    }

    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[`${tab}:${name}`] = flat;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    this._populatePresets(tab);
    console.log(`[Controls] Saved config "${name}" for ${tab}`);
  }

  _deleteConfig() {
    const value = this._presetSelect.value;
    if (!value.startsWith('saved:')) {
      return; // Can't delete built-in presets
    }
    const name = value.slice(6);
    const tab = this._activeTab;

    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    delete all[`${tab}:${name}`];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    this._populatePresets(tab);
    console.log(`[Controls] Deleted config "${name}"`);
  }

  _getSavedConfigs(tab) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const prefix = `${tab}:`;
    return Object.keys(all)
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
  }

  _applyStyles() {
    if (document.getElementById('controls-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'controls-panel-styles';
    style.textContent = `
      #controls-panel {
        top: 136px; /* initial, updated dynamically */
        max-height: calc(100vh - 152px);
      }
      #controls-panel .cp-body {
        overflow-y: auto;
        max-height: calc(100vh - 200px);
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.15) transparent;
      }

      /* Tabs */
      .ctrl-tabs {
        display: flex;
        gap: 2px;
        margin-bottom: 8px;
      }
      .ctrl-tab {
        flex: 1;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: #888;
        padding: 5px 4px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        font-family: inherit;
        transition: all 0.15s;
      }
      .ctrl-tab:hover { background: rgba(255,255,255,0.1); color: #ccc; }
      .ctrl-tab.active { background: rgba(255,255,255,0.12); color: #eee; border-color: rgba(255,255,255,0.2); }

      /* Preset bar */
      .ctrl-preset-bar {
        display: flex;
        gap: 4px;
        margin-bottom: 10px;
        align-items: center;
      }
      .ctrl-preset-select {
        flex: 1;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #ccc;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-family: inherit;
      }
      .ctrl-preset-btn {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #ccc;
        padding: 3px 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.15s;
      }
      .ctrl-preset-btn:hover { background: rgba(255,255,255,0.15); }

      /* Config section rows */
      .cs-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 8px;
      }
      .cs-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: #aaa;
      }
      .cs-info {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        background: rgba(255,255,255,0.08);
        border-radius: 50%;
        font-size: 8px;
        font-style: italic;
        color: #888;
        cursor: help;
        position: relative;
        flex-shrink: 0;
      }
      /* Tooltip rendered by JS as a fixed-position element to avoid clipping */

      /* Slider */
      .cs-slider-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .cs-slider {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255,255,255,0.12);
        border-radius: 2px;
        outline: none;
      }
      .cs-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        background: #4fc3f7;
        border-radius: 50%;
        cursor: pointer;
      }
      .cs-val {
        font-size: 10px;
        color: #4fc3f7;
        min-width: 32px;
        text-align: right;
      }

      /* Number input */
      .cs-number {
        width: 80px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #ccc;
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-family: inherit;
      }
      .cs-number:focus { outline: none; border-color: rgba(79,195,247,0.5); }

      /* Toggle */
      .cs-toggle-wrap {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      .cs-toggle { display: none; }
      .cs-toggle-indicator {
        width: 28px;
        height: 14px;
        background: rgba(255,255,255,0.12);
        border-radius: 7px;
        position: relative;
        transition: background 0.2s;
      }
      .cs-toggle-indicator::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        background: #888;
        border-radius: 50%;
        transition: all 0.2s;
      }
      .cs-toggle:checked + .cs-toggle-indicator {
        background: rgba(79,195,247,0.3);
      }
      .cs-toggle:checked + .cs-toggle-indicator::after {
        left: 16px;
        background: #4fc3f7;
      }

      /* Keyboard shortcuts */
      .ctrl-keys {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .ctrl-key-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 10px;
      }
      .ctrl-key-row kbd {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 10px;
        font-family: inherit;
        color: #4fc3f7;
        min-width: 50px;
        text-align: center;
      }
      .ctrl-key-row span {
        color: #aaa;
      }
    `;
    document.head.appendChild(style);
  }
}
