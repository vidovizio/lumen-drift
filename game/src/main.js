import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_OVER, EVENT_VICTORY } from './world.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const input = createInput(canvas);
const renderer = createRenderer(canvas, createRandom(seed + 101));
const audio = createAudio();

let screen = SCREEN_TITLE;
let best = readBest();
let accumulator = 0;
let lastFrame = performance.now();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Ignore storage failures.
  }
}

function announce(message) {
  status.textContent = message;
}

function startGame() {
  audio.begin();
  world.reset();
  screen = SCREEN_PLAY;
  accumulator = 0;
  announce('Lumen Drift online. Hold the line.');
  audio.wave();
}

function endGame(victory) {
  screen = victory ? SCREEN_VICTORY : SCREEN_OVER;
  if (world.state.score > best) {
    best = world.state.score;
    saveBest(best);
  }
  announce(victory ? 'Victory. The Maw falls.' : 'Hull gone. Drift again.');
  audio[victory ? 'win' : 'lose']();
}

function handleActions() {
  const actions = input.takeActions();
  if (actions.mute) {
    audio.toggleMute();
    announce(audio.mutedState() ? 'Audio muted.' : 'Audio enabled.');
  }

  if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
    if (actions.start || actions.restart) {
      startGame();
    }
    return;
  }

  if (screen === SCREEN_PAUSED) {
    if (actions.pause || actions.start) {
      screen = SCREEN_PLAY;
      announce('Back in the drift.');
    }
    return;
  }

  if (actions.pause) {
    screen = SCREEN_PAUSED;
    announce('Paused.');
  }
}

function stepSimulation() {
  const move = input.moveVector();
  const aim = input.aim();
  const firing = input.firing();
  const event = world.step(STEP, { moveVector: () => move, aim: () => aim, firing: () => firing });
  if (event === EVENT_OVER) {
    endGame(false);
  } else if (event === EVENT_VICTORY) {
    endGame(true);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  accumulator += Math.min((now - lastFrame) / 1000, MAX_FRAME);
  lastFrame = now;

  handleActions();

  if (screen === SCREEN_PLAY) {
    while (accumulator >= STEP) {
      stepSimulation();
      accumulator -= STEP;
    }
  } else {
    accumulator = 0;
  }

  renderer.draw(world.state, screen, best);
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(scene.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

announce('Lumen Drift. Click or press Enter to start.');
if (shot) {
  runShot(shot);
} else {
  requestAnimationFrame(frame);
}
