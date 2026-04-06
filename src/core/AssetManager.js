import { Howl } from 'howler';
import { Assets, Texture } from 'pixi.js';

const assetModules = import.meta.glob('../assets/**/*.{jpg,png,wav}', { eager: true, query: '?url', import: 'default' });

const IMG_EXTENSIONS = ['jpeg', 'jpg', 'png'];
const SOUND_EXTENSIONS = ['wav', 'ogg', 'm4a'];

/**
 * Global asset manager to help streamline asset usage in your game.
 * Automatically scans and stores a manifest of all available assets, so that they could
 * be loaded at any time
 */
class AssetManager {
  constructor() {
    this.renderer = null;

    this._assets = {};
    this._sounds = {};
    this._images = {};
    this._textures = {};

    this._importAssets();
  }

  /**
   * The main method of the AssetManager, use this to load any desired assets
   *
   * @param {Object} assets - { images, sounds } maps of id → url
   * @param {Function} progressCallback - called with progress percentage
   * @return {Promise}
   */
  async load(assets = { images: this._images, sounds: this._sounds }, progressCallback = () => {}) {
    const { images, sounds } = assets;
    const imagesCount = images ? Object.keys(images).length : 0;
    const soundsCount = sounds ? Object.keys(sounds).length : 0;
    const loadPromises = [];

    if (imagesCount) {
      loadPromises.push(this.loadImages(images, progressCallback));
    }

    if (soundsCount) {
      loadPromises.push(this.loadSounds(sounds, progressCallback));
    }

    return Promise.all(loadPromises);
  }

  /**
   * Load images using Pixi v7 Assets API
   * @return {Promise}
   */
  async loadImages(images = {}, progressCallback = () => {}) {
    const entries = Object.entries(images);
    let loaded = 0;

    for (const [id, url] of entries) {
      if (!Assets.resolver.hasKey(id)) {
        Assets.add({ alias: id, src: url });
      }
      await Assets.load(id);
      loaded++;
      progressCallback(Math.round((loaded / entries.length) * 100));
    }
  }

  /**
   * In Pixi v7, textures loaded via Assets are automatically uploaded to the GPU.
   * This method is kept for API compatibility but is now a no-op.
   */
  async prepareImages() {
    return Promise.resolve();
  }

  /**
   * Load sounds using Howler
   * @return {Promise}
   */
  loadSounds(sounds = {}, progressCallback = () => {}) {
    const soundPromises = [];

    for (const [id, url] of Object.entries(sounds)) {
      soundPromises.push(this._loadSound(id, url));
    }

    Promise.all(soundPromises).then(() => progressCallback(100));

    return Promise.all(soundPromises);
  }

  get images() {
    return this._images;
  }

  get sounds() {
    return this._sounds;
  }

  get assets() {
    return this._assets;
  }

  get textures() {
    return this._textures;
  }

  set textures(obj) {
    this._textures = obj;
  }

  _loadSound(id, url) {
    const sound = new Howl({ src: [url] });

    this._sounds[id] = sound;

    return new Promise((res) => sound.once('load', res));
  }

  /**
   * Scans the assets directory via Vite's import.meta.glob and creates a manifest
   * of all available assets, split into images and sounds.
   */
  _importAssets() {
    for (const [path, url] of Object.entries(assetModules)) {
      const parts = path.split('/');
      const filename = parts[parts.length - 1];
      const dotIndex = filename.lastIndexOf('.');
      const ext = filename.substring(dotIndex + 1).toLowerCase();

      // Build an id from the directory structure:
      // ../assets/textures/colors/1.jpg → "textures/colors/1"
      // ../assets/background.jpg → "background"
      const relativePath = path.replace('../assets/', '');
      const id = relativePath.substring(0, relativePath.lastIndexOf('.'));

      this._assets[id] = url;

      if (IMG_EXTENSIONS.includes(ext)) {
        this._images[id] = url;
      }

      if (SOUND_EXTENSIONS.includes(ext)) {
        this._sounds[id] = url;
      }
    }
  }
}

export default new AssetManager();
