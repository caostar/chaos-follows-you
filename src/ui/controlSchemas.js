/**
 * Schema definitions, tooltips, and presets for all controllers.
 * Used by ControlsPanel to auto-generate UI controls.
 */

// --- Schema field types ---
// { type: 'slider', min, max, step, label, tip }
// { type: 'number', min, max, step, label, tip }
// { type: 'toggle', label, tip }
// { type: 'select', options: [...], label, tip }
// { type: 'range', minKey, maxKey, min, max, step, label, tip }  -- min/max pair

export const RANDOM_SCHEMA = {
  _group: 'Random Mode',
  fields: [
    { key: 'inactivityTimeout', type: 'number', min: 5, max: 300, step: 1, label: 'Inactivity timeout (s)', tip: 'Seconds of no input before random mode auto-starts' },
    // Rhythm
    { key: 'rhythm.interval.min', type: 'number', min: 0.1, max: 10, step: 0.1, label: 'Rhythm min (s)', tip: 'Minimum seconds between actions' },
    { key: 'rhythm.interval.max', type: 'number', min: 0.5, max: 20, step: 0.1, label: 'Rhythm max (s)', tip: 'Maximum seconds between actions' },
    // Weights
    { key: 'movement.weight', type: 'slider', min: 0, max: 100, step: 1, label: 'Move weight', tip: 'Relative probability of a move action. Higher = more moves' },
    { key: 'shapeChange.weight', type: 'slider', min: 0, max: 100, step: 1, label: 'Shape weight', tip: 'Relative probability of a shape change' },
    { key: 'zoom.weight', type: 'slider', min: 0, max: 100, step: 1, label: 'Zoom weight', tip: 'Relative probability of a zoom action' },
    // Movement
    { key: 'movement.duration.min', type: 'number', min: 0.1, max: 10, step: 0.1, label: 'Move min (s)', tip: 'Fastest move duration' },
    { key: 'movement.duration.max', type: 'number', min: 0.5, max: 20, step: 0.1, label: 'Move max (s)', tip: 'Slowest move duration' },
    { key: 'movement.cooldown', type: 'number', min: 0, max: 30, step: 0.5, label: 'Move cooldown (s)', tip: 'Minimum time between move actions' },
    // Zoom
    { key: 'zoom.inBias', type: 'slider', min: 0, max: 1, step: 0.01, label: 'Zoom in bias', tip: '0 = always zoom out, 1 = always zoom in, 0.5 = equal chance' },
    { key: 'zoom.homeScale', type: 'number', min: 0.1, max: 10, step: 0.1, label: 'Home scale', tip: 'The "comfortable" zoom level. Camera drifts back toward this when too zoomed in/out' },
    { key: 'zoom.homeStrength', type: 'slider', min: 0, max: 1, step: 0.05, label: 'Home pull', tip: 'How strongly the camera is pulled back to home scale. 0 = no pull, 1 = strong pull' },
    { key: 'zoom.minScale', type: 'number', min: 0.01, max: 1, step: 0.01, label: 'Min scale', tip: 'Absolute minimum zoom level. Prevents the scene from becoming tiny' },
    { key: 'zoom.maxScale', type: 'number', min: 1, max: 100, step: 1, label: 'Max scale', tip: 'Absolute maximum zoom level' },
    { key: 'zoom.cooldown', type: 'number', min: 0, max: 30, step: 0.5, label: 'Zoom cooldown (s)', tip: 'Minimum time between zoom actions' },
    { key: 'zoom.duration.min', type: 'number', min: 0.5, max: 10, step: 0.5, label: 'Zoom min (s)', tip: 'Fastest zoom animation' },
    { key: 'zoom.duration.max', type: 'number', min: 1, max: 20, step: 0.5, label: 'Zoom max (s)', tip: 'Slowest zoom animation' },
    // Pause
    { key: 'pause.chance', type: 'slider', min: 0, max: 1, step: 0.05, label: 'Pause chance', tip: 'Probability of a contemplative pause between actions' },
    { key: 'pause.duration.min', type: 'number', min: 0.5, max: 10, step: 0.5, label: 'Pause min (s)', tip: 'Shortest pause' },
    { key: 'pause.duration.max', type: 'number', min: 1, max: 30, step: 0.5, label: 'Pause max (s)', tip: 'Longest pause' },
  ],
};

export const AUDIO_SCHEMA = {
  _group: 'Audio',
  fields: [
    // Thresholds
    { key: 'thresholds.bass', type: 'slider', min: 0, max: 1, step: 0.01, label: 'Bass threshold', tip: 'Bass energy level that triggers a reaction. Lower = more reactive' },
    { key: 'thresholds.mid', type: 'slider', min: 0, max: 1, step: 0.01, label: 'Mid threshold', tip: 'When exceeded, shape changes become 2x more likely' },
    { key: 'thresholds.treble', type: 'slider', min: 0, max: 1, step: 0.01, label: 'Treble threshold', tip: 'When exceeded, zoom actions become 3x more likely' },
    { key: 'thresholds.micEnergy', type: 'slider', min: 0, max: 0.5, step: 0.01, label: 'Mic threshold', tip: 'Overall energy threshold for mic mode. Lower because mic is quieter' },
    // Action weights
    { key: 'actions.move.weight', type: 'slider', min: 0, max: 100, step: 1, label: 'Move weight', tip: 'Relative probability of moving the emitter when audio reacts' },
    { key: 'actions.shapeChange.weight', type: 'slider', min: 0, max: 100, step: 1, label: 'Shape weight', tip: 'Relative probability of generating a new chaos star' },
    { key: 'actions.zoomIn.weight', type: 'slider', min: 0, max: 100, step: 1, label: 'Zoom in weight', tip: 'Relative probability of zooming in on a beat' },
    { key: 'actions.zoomOut.weight', type: 'slider', min: 0, max: 100, step: 1, label: 'Zoom out weight', tip: 'Relative probability of zooming out on a beat' },
    // Behavior
    { key: 'reactionCooldown', type: 'number', min: 0, max: 1000, step: 10, label: 'Cooldown (ms)', tip: 'Minimum ms between visual reactions. Prevents seizure-speed flickering' },
    { key: 'bassMoveFactor', type: 'slider', min: 0, max: 1, step: 0.05, label: 'Bass move factor', tip: 'How much bass amplitude affects move speed. 0 = uniform, 1 = bass controls speed' },
    // Zoom bounds
    { key: 'zoom.minScale', type: 'number', min: 0.01, max: 1, step: 0.01, label: 'Min zoom', tip: 'Minimum zoom level for audio reactions' },
    { key: 'zoom.maxScale', type: 'number', min: 1, max: 50, step: 1, label: 'Max zoom', tip: 'Maximum zoom level for audio reactions' },
    { key: 'zoom.homeScale', type: 'number', min: 0.1, max: 10, step: 0.1, label: 'Home scale', tip: 'Camera is pushed back toward this zoom level when drifting too far' },
    // Sustained zoom
    { key: 'sustainedZoom.enabled', type: 'toggle', label: 'Sustained zoom', tip: 'Gradually zoom in during sustained loud passages' },
    { key: 'sustainedZoom.frames', type: 'number', min: 10, max: 300, step: 10, label: 'Frames', tip: 'How many consecutive high-energy frames needed to trigger sustained zoom (~60 = 1 second)' },
    { key: 'sustainedZoom.threshold', type: 'slider', min: 0, max: 1, step: 0.05, label: 'Energy threshold', tip: 'Average energy level over those frames that triggers the zoom' },
    { key: 'sustainedZoom.zoomFactor', type: 'number', min: 1.0, max: 3.0, step: 0.1, label: 'Zoom factor', tip: 'How much to zoom in (multiplier on current scale)' },
    { key: 'sustainedZoom.duration', type: 'number', min: 0.5, max: 10, step: 0.5, label: 'Duration (s)', tip: 'Duration of the sustained zoom animation' },
  ],
};

export const HAND_SCHEMA = {
  _group: 'Hand Tracking',
  fields: [
    { key: 'detectionInterval', type: 'number', min: 16, max: 200, step: 1, label: 'Detection interval (ms)', tip: 'How often to run detection. 66 = ~15fps, 33 = ~30fps. Lower = smoother but more CPU' },
    { key: 'minDetectionConfidence', type: 'slider', min: 0.1, max: 1, step: 0.05, label: 'Detection confidence', tip: 'Minimum confidence to accept a hand. Higher = fewer false positives. Requires tracking restart' },
    { key: 'minTrackingConfidence', type: 'slider', min: 0.1, max: 1, step: 0.05, label: 'Tracking confidence', tip: 'Minimum confidence to maintain tracking between frames. Requires restart' },
    { key: 'pinchThreshold', type: 'slider', min: 0.01, max: 0.15, step: 0.005, label: 'Pinch threshold', tip: 'Distance between thumb and index to trigger pinch. Lower = need tighter pinch' },
    { key: 'pinchCooldown', type: 'number', min: 100, max: 2000, step: 50, label: 'Pinch cooldown (ms)', tip: 'Minimum time between pinch triggers' },
    { key: 'twoHandZoomThreshold', type: 'slider', min: 0.005, max: 0.05, step: 0.001, label: 'Zoom threshold', tip: 'Minimum wrist distance change to trigger a zoom gesture' },
    { key: 'twoHandZoomCooldown', type: 'number', min: 200, max: 3000, step: 100, label: 'Zoom cooldown (ms)', tip: 'Minimum time between two-hand zoom gestures' },
    { key: 'twoHandZoomRange.min', type: 'number', min: 1.1, max: 3.0, step: 0.1, label: 'Zoom factor min', tip: 'Minimum random zoom multiplier per gesture' },
    { key: 'twoHandZoomRange.max', type: 'number', min: 1.5, max: 5.0, step: 0.1, label: 'Zoom factor max', tip: 'Maximum random zoom multiplier per gesture' },
    { key: 'twoHandZoomDuration.min', type: 'number', min: 0.5, max: 5.0, step: 0.5, label: 'Zoom duration min (s)', tip: 'Fastest zoom animation duration' },
    { key: 'twoHandZoomDuration.max', type: 'number', min: 1.0, max: 8.0, step: 0.5, label: 'Zoom duration max (s)', tip: 'Slowest zoom animation duration' },
    { key: 'smoothing', type: 'slider', min: 0, max: 0.9, step: 0.05, label: 'Smoothing', tip: 'Movement smoothing. 0 = raw (jittery), 0.5 = smooth (laggy). 0.3 is a good balance' },
    { key: 'debugAlpha', type: 'slider', min: 0.05, max: 1, step: 0.05, label: 'Debug alpha', tip: 'Opacity of the video feed in expanded fullscreen mode' },
  ],
};

// --- Presets ---

export const RANDOM_PRESETS = {
  'Default': null, // null = reload from JSON file
  'Meditative drift': {
    'rhythm.interval.min': 2.0, 'rhythm.interval.max': 6.0,
    'movement.weight': 80, 'shapeChange.weight': 10, 'zoom.weight': 10,
    'movement.duration.min': 3.0, 'movement.duration.max': 8.0,
    'zoom.inBias': 0.5, 'zoom.homeScale': 1.0, 'zoom.homeStrength': 0.5,
    'pause.chance': 0.3, 'pause.duration.min': 2.0, 'pause.duration.max': 6.0,
  },
  'Nervous energy': {
    'rhythm.interval.min': 0.3, 'rhythm.interval.max': 1.0,
    'movement.weight': 50, 'shapeChange.weight': 35, 'zoom.weight': 15,
    'movement.duration.min': 0.5, 'movement.duration.max': 1.5,
    'zoom.inBias': 0.5, 'zoom.homeScale': 1.0, 'zoom.homeStrength': 0.4,
    'pause.chance': 0.05,
  },
  'Deep zoom explorer': {
    'rhythm.interval.min': 1.0, 'rhythm.interval.max': 3.0,
    'movement.weight': 30, 'shapeChange.weight': 20, 'zoom.weight': 50,
    'zoom.inBias': 0.7, 'zoom.homeScale': 3.0, 'zoom.homeStrength': 0.2,
    'zoom.duration.min': 3.0, 'zoom.duration.max': 8.0,
    'pause.chance': 0.1,
  },
  'Breathing': {
    'rhythm.interval.min': 2.0, 'rhythm.interval.max': 4.0,
    'movement.weight': 40, 'shapeChange.weight': 10, 'zoom.weight': 50,
    'zoom.inBias': 0.5, 'zoom.homeScale': 1.0, 'zoom.homeStrength': 0.6,
    'zoom.duration.min': 3.0, 'zoom.duration.max': 6.0,
    'pause.chance': 0.2, 'pause.duration.min': 2.0, 'pause.duration.max': 5.0,
  },
  'Mostly still then erupts': {
    'rhythm.interval.min': 3.0, 'rhythm.interval.max': 10.0,
    'movement.weight': 70, 'shapeChange.weight': 20, 'zoom.weight': 10,
    'movement.duration.min': 0.3, 'movement.duration.max': 0.8,
    'zoom.inBias': 0.5, 'zoom.homeScale': 1.0, 'zoom.homeStrength': 0.3,
    'pause.chance': 0.6, 'pause.duration.min': 3.0, 'pause.duration.max': 12.0,
  },
};

export const AUDIO_PRESETS = {
  'Default': null,
  'Bass cannon': {
    'thresholds.bass': 0.85, 'thresholds.mid': 0.9, 'thresholds.treble': 0.95,
    'actions.move.weight': 30, 'actions.shapeChange.weight': 60, 'actions.zoomIn.weight': 8, 'actions.zoomOut.weight': 2,
    'reactionCooldown': 150, 'bassMoveFactor': 0.8,
  },
  'Ambient wash': {
    'thresholds.bass': 0.3, 'thresholds.mid': 0.4, 'thresholds.treble': 0.5, 'thresholds.micEnergy': 0.05,
    'actions.move.weight': 70, 'actions.shapeChange.weight': 25, 'actions.zoomIn.weight': 3, 'actions.zoomOut.weight': 2,
    'reactionCooldown': 200, 'bassMoveFactor': 0.2,
    'sustainedZoom.enabled': true, 'sustainedZoom.frames': 120, 'sustainedZoom.threshold': 0.3, 'sustainedZoom.zoomFactor': 1.1, 'sustainedZoom.duration': 5.0,
  },
  'Mic performer': {
    'thresholds.micEnergy': 0.05,
    'actions.move.weight': 40, 'actions.shapeChange.weight': 50, 'actions.zoomIn.weight': 5, 'actions.zoomOut.weight': 5,
    'reactionCooldown': 50, 'bassMoveFactor': 0.6,
    'sustainedZoom.enabled': true, 'sustainedZoom.frames': 30, 'sustainedZoom.threshold': 0.15, 'sustainedZoom.zoomFactor': 1.5, 'sustainedZoom.duration': 2.0,
  },
  'Gentle pulse': {
    'thresholds.bass': 0.5, 'thresholds.mid': 0.6, 'thresholds.treble': 0.7,
    'actions.move.weight': 60, 'actions.shapeChange.weight': 30, 'actions.zoomIn.weight': 5, 'actions.zoomOut.weight': 5,
    'reactionCooldown': 300, 'bassMoveFactor': 0.3,
    'sustainedZoom.enabled': false,
  },
  'Maximum chaos': {
    'thresholds.bass': 0.1, 'thresholds.mid': 0.1, 'thresholds.treble': 0.1,
    'actions.move.weight': 30, 'actions.shapeChange.weight': 30, 'actions.zoomIn.weight': 20, 'actions.zoomOut.weight': 20,
    'reactionCooldown': 0, 'bassMoveFactor': 1.0,
    'sustainedZoom.enabled': false,
  },
};

export const HAND_PRESETS = {
  'Default': null,
  'Puppet master': {
    'detectionInterval': 33, 'smoothing': 0.1,
    'pinchThreshold': 0.05, 'pinchCooldown': 300,
    'twoHandZoomCooldown': 500, 'twoHandZoomRange.min': 1.2, 'twoHandZoomRange.max': 2.0,
    'twoHandZoomDuration.min': 1.0, 'twoHandZoomDuration.max': 2.0,
  },
  'Lazy conductor': {
    'detectionInterval': 100, 'smoothing': 0.6,
    'pinchThreshold': 0.08, 'pinchCooldown': 1000,
    'twoHandZoomThreshold': 0.03, 'twoHandZoomCooldown': 1500,
    'twoHandZoomRange.min': 1.2, 'twoHandZoomRange.max': 1.8,
    'twoHandZoomDuration.min': 2.0, 'twoHandZoomDuration.max': 4.0,
  },
  'Zoom sculptor': {
    'detectionInterval': 50, 'smoothing': 0.3,
    'pinchThreshold': 0.07, 'pinchCooldown': 200,
    'twoHandZoomThreshold': 0.02, 'twoHandZoomCooldown': 800,
    'twoHandZoomRange.min': 1.3, 'twoHandZoomRange.max': 2.5,
    'twoHandZoomDuration.min': 1.5, 'twoHandZoomDuration.max': 3.0,
  },
  'Performance safe': {
    'detectionInterval': 80, 'smoothing': 0.4,
    'pinchThreshold': 0.07, 'pinchCooldown': 600,
    'twoHandZoomThreshold': 0.025, 'twoHandZoomCooldown': 1200,
    'twoHandZoomRange.min': 1.2, 'twoHandZoomRange.max': 1.8,
    'twoHandZoomDuration.min': 2.0, 'twoHandZoomDuration.max': 4.0,
  },
  'Maximum precision': {
    'detectionInterval': 33, 'smoothing': 0.05,
    'pinchThreshold': 0.04, 'pinchCooldown': 200,
    'twoHandZoomThreshold': 0.015, 'twoHandZoomCooldown': 500,
    'twoHandZoomRange.min': 1.5, 'twoHandZoomRange.max': 3.0,
    'twoHandZoomDuration.min': 1.0, 'twoHandZoomDuration.max': 2.0,
  },
};

export const KEYBOARD_SHORTCUTS = [
  { key: 'Mouse move', desc: 'Guide the particle emitter' },
  { key: 'Click', desc: 'New chaos star shape' },
  { key: 'Space', desc: 'New chaos star' },
  { key: 'R', desc: 'Random move' },
  { key: 'T', desc: 'Random move (alternate)' },
  { key: 'Z / X', desc: 'Zoom in / out' },
  { key: 'Arrows', desc: 'Move emitter directionally' },
  { key: 'A', desc: 'Toggle random mode' },
  { key: 'M', desc: 'Toggle audio panel' },
  { key: 'H', desc: 'Toggle hand panel' },
  { key: 'D', desc: 'Toggle hand debug video' },
  { key: 'G', desc: 'Toggle controls panel' },
  { key: 'F', desc: 'Toggle browser fullscreen' },
  { key: 'Q', desc: 'Hide/show all panels' },
];

// --- Helpers ---

export function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => {
    if (o[k] === undefined) o[k] = {};
    return o[k];
  }, obj);
  target[last] = value;
}
