/**
 * ConfigSection — Renders editable controls for a single controller's config.
 * Given a schema + config object, builds sliders/toggles/number inputs with tooltips.
 * Mutates config in place — controllers read config every tick so changes are live.
 */
import { getNestedValue, setNestedValue } from './controlSchemas.js';

export default class ConfigSection {
  /**
   * @param {object} schema - Schema from controlSchemas.js
   * @param {object} config - Controller's config object (mutated in place)
   * @param {HTMLElement} container - DOM element to render into
   */
  constructor(schema, config, container) {
    this.schema = schema;
    this.config = config;
    this.container = container;
    this._inputs = {};
    this._build();
  }

  /** Refresh all UI controls to match current config values */
  refresh() {
    for (const field of this.schema.fields) {
      const input = this._inputs[field.key];
      if (!input) continue;
      const val = getNestedValue(this.config, field.key);
      if (val === undefined) continue;

      if (field.type === 'toggle') {
        input.checked = !!val;
      } else if (field.type === 'slider') {
        input.value = val;
        input.nextElementSibling.textContent = val;
      } else if (field.type === 'number') {
        input.value = val;
      }
    }
  }

  _build() {
    for (const field of this.schema.fields) {
      const row = document.createElement('div');
      row.className = 'cs-row';

      // Label + info tooltip
      const label = document.createElement('label');
      label.className = 'cs-label';
      label.textContent = field.label;

      const info = document.createElement('span');
      info.className = 'cs-info';
      info.textContent = 'i';
      info.setAttribute('data-tip', field.tip);
      label.appendChild(info);

      row.appendChild(label);

      // Control
      const val = getNestedValue(this.config, field.key);
      let input;

      if (field.type === 'slider') {
        const wrap = document.createElement('div');
        wrap.className = 'cs-slider-wrap';

        input = document.createElement('input');
        input.type = 'range';
        input.className = 'cs-slider';
        input.min = field.min;
        input.max = field.max;
        input.step = field.step;
        input.value = val ?? field.min;

        const valLabel = document.createElement('span');
        valLabel.className = 'cs-val';
        valLabel.textContent = input.value;

        input.addEventListener('input', () => {
          const v = parseFloat(input.value);
          setNestedValue(this.config, field.key, v);
          valLabel.textContent = v;
        });

        wrap.appendChild(input);
        wrap.appendChild(valLabel);
        row.appendChild(wrap);
      } else if (field.type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.className = 'cs-number';
        input.min = field.min;
        input.max = field.max;
        input.step = field.step;
        input.value = val ?? field.min;

        input.addEventListener('change', () => {
          setNestedValue(this.config, field.key, parseFloat(input.value));
        });

        // Prevent keyboard shortcuts while typing
        input.addEventListener('keydown', (e) => e.stopPropagation());
        input.addEventListener('keyup', (e) => e.stopPropagation());
        input.addEventListener('keypress', (e) => e.stopPropagation());

        row.appendChild(input);
      } else if (field.type === 'toggle') {
        const wrap = document.createElement('label');
        wrap.className = 'cs-toggle-wrap';

        input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'cs-toggle';
        input.checked = !!val;

        input.addEventListener('change', () => {
          setNestedValue(this.config, field.key, input.checked);
        });

        const indicator = document.createElement('span');
        indicator.className = 'cs-toggle-indicator';

        wrap.appendChild(input);
        wrap.appendChild(indicator);
        row.appendChild(wrap);
      }

      this._inputs[field.key] = input;
      this.container.appendChild(row);
    }
  }
}
