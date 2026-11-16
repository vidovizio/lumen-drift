export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'lumen-drift.best';

export const PLAYER = {
  radius: 18,
  speed: 330,
  maxHull: 100,
  fireCooldown: 0.13,
  drag: 0.8,
};

export const SHARD = {
  radius: 7,
  magnet: 220,
  value: 48,
};

export const COMBO = {
  min: 1,
  max: 8,
  decay: 0.42,
  pickupBoost: 0.18,
};

export const WAVES = [
  { label: 'Wave 1', count: 4, types: ['drifter'] },
  { label: 'Wave 2', count: 6, types: ['drifter', 'weaver'] },
  { label: 'Wave 3', count: 8, types: ['drifter', 'weaver'] },
  { label: 'Wave 4', count: 10, types: ['drifter', 'weaver', 'bulwark'] },
  { label: 'Wave 5', count: 11, types: ['weaver', 'bulwark'] },
  { label: 'Wave 6', count: 12, types: ['drifter', 'weaver', 'bulwark'] },
  { label: 'Wave 7', count: 13, types: ['weaver', 'bulwark'] },
  { label: 'Wave 8', count: 1, types: ['maw'] },
];

export const PALETTE = {
  sky: '#050b16',
  star: '#93d9ff',
  gridA: 'rgba(96, 164, 255, 0.12)',
  gridB: 'rgba(145, 249, 255, 0.08)',
  player: '#8ff7ff',
  playerGlow: '#8ff7ff',
  bolt: '#9ae8ff',
  enemyDrifter: '#ff4ad9',
  enemyWeaver: '#ffb347',
  enemyBulwark: '#48f0d3',
  enemyMaw: '#ff588a',
  shard: '#5ce7ff',
  hull: '#6df3b8',
  hullWarn: '#ff5b7f',
  panel: 'rgba(11, 16, 23, 0.78)',
  panelEdge: 'rgba(129, 222, 255, 0.8)',
  text: '#edfaff',
  muted: '#9bb0c4',
  hurt: '#ff6e8c',
  gold: '#f8d76a',
  score: '#8ef5ff',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
