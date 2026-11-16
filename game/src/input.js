import { FIELD } from './config.js';

export function createInput(canvas) {
  const keys = Object.create(null);
  const pressed = Object.create(null);
  const state = {
    pointerX: FIELD.width / 2,
    pointerY: FIELD.height / 2,
    pointerDown: false,
  };

  function eventToPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
    const y = ((event.clientY - rect.top) / rect.height) * FIELD.height;
    state.pointerX = x;
    state.pointerY = y;
  }

  function setKey(event, code, active) {
    if (active && !keys[code]) pressed[code] = true;
    keys[code] = active;
    if (active && code === 'Space' && event) {
      event.preventDefault();
    }
  }

  document.addEventListener('keydown', (event) => {
    const code = event.code;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP', 'KeyM', 'KeyR', 'Escape', 'Enter'].includes(code)) {
      event.preventDefault();
    }
    setKey(event, code, true);
  });

  document.addEventListener('keyup', (event) => {
    setKey(event, event.code, false);
  });

  canvas.addEventListener('pointermove', eventToPointer);
  canvas.addEventListener('pointerdown', (event) => {
    eventToPointer(event);
    state.pointerDown = true;
  });
  canvas.addEventListener('pointerup', () => {
    state.pointerDown = false;
  });
  canvas.addEventListener('pointerleave', () => {
    state.pointerDown = false;
  });

  return {
    takeActions() {
      const actions = {
        start: Boolean(pressed.Enter || pressed.Space),
        pause: Boolean(pressed.KeyP || pressed.Escape),
        mute: Boolean(pressed.KeyM),
        restart: Boolean(pressed.KeyR),
      };
      for (const key in pressed) delete pressed[key];
      return actions;
    },
    isDown(code) {
      return !!keys[code];
    },
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.KeyA || keys.ArrowLeft) x -= 1;
      if (keys.KeyD || keys.ArrowRight) x += 1;
      if (keys.KeyW || keys.ArrowUp) y -= 1;
      if (keys.KeyS || keys.ArrowDown) y += 1;
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    },
    aim() {
      return { x: state.pointerX, y: state.pointerY };
    },
    firing() {
      return state.pointerDown || !!keys.Space;
    },
    pointerDown() {
      return state.pointerDown;
    },
  };
}
