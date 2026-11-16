import { FIELD, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_MIN_SECONDS = 30;
const LATE_WAVE_SECONDS = 10;
const SIMULATION_LIMIT = 600;
const FIRE_RANGE = 500;
const KITE_DISTANCE = 270;
const DANGER_DISTANCE = 210;
const NEAR_ENEMY_DISTANCE = 320;

function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function nearestEntity(entities, player) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const entity of entities) {
    const candidateDistance = distance(entity.x, entity.y, player.x, player.y);
    if (candidateDistance < nearestDistance) {
      nearest = entity;
      nearestDistance = candidateDistance;
    }
  }
  return nearest ? { entity: nearest, distance: nearestDistance } : null;
}

function normalized(x, y) {
  const length = Math.hypot(x, y);
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

function keepInArena(move, player) {
  const margin = 105;
  if (player.x < margin) move.x += 1;
  if (player.x > FIELD.width - margin) move.x -= 1;
  if (player.y < margin) move.y += 1;
  if (player.y > FIELD.height - margin) move.y -= 1;
  return normalized(move.x, move.y);
}

function competentPilot(world) {
  const { state } = world;
  const player = state.player;
  const nearest = nearestEntity(state.enemies, player);
  let move = { x: 0, y: 0 };

  if (nearest && nearest.distance <= NEAR_ENEMY_DISTANCE) {
    const toward = normalized(nearest.entity.x - player.x, nearest.entity.y - player.y);
    const tangent = { x: -toward.y, y: toward.x };
    if (nearest.distance < DANGER_DISTANCE) {
      move = { x: -toward.x + tangent.x * 0.7, y: -toward.y + tangent.y * 0.7 };
    } else if (nearest.distance > KITE_DISTANCE) {
      move = { x: toward.x + tangent.x * 0.55, y: toward.y + tangent.y * 0.55 };
    } else {
      move = { x: tangent.x + toward.x * 0.15, y: tangent.y + toward.y * 0.15 };
    }
  } else {
    const shard = nearestEntity(state.shards, player);
    if (shard) {
      move = normalized(shard.entity.x - player.x, shard.entity.y - player.y);
    } else if (nearest) {
      move = normalized(nearest.entity.x - player.x, nearest.entity.y - player.y);
    }
  }
  move = keepInArena(move, player);

  return {
    moveVector: () => move,
    aim: () => nearest?.entity ?? { x: player.x + 1, y: player.y },
    firing: () => Boolean(nearest && nearest.distance <= FIRE_RANGE),
  };
}

function recklessPilot(world) {
  const { state } = world;
  const player = state.player;
  const nearest = nearestEntity(state.enemies, player);
  const move = nearest
    ? normalized(nearest.entity.x - player.x, nearest.entity.y - player.y)
    : { x: 0, y: 0 };
  return {
    moveVector: () => move,
    aim: () => nearest?.entity ?? { x: player.x + 1, y: player.y },
    firing: () => true,
  };
}

function stepFor(world, input) {
  return world.step(STEP, {
    moveVector: input.moveVector,
    aim: input.aim,
    firing: input.firing,
  });
}

function runAmbient(world) {
  const idle = {
    moveVector: () => ({ x: 0, y: 0 }),
    aim: () => ({ x: FIELD.width / 2, y: FIELD.height / 2 }),
    firing: () => false,
  };
  for (let index = 0; index < START_SECONDS / STEP; index += 1) {
    stepFor(world, idle);
  }
}

function runPlay(world) {
  const maxSteps = SIMULATION_LIMIT / STEP;
  let denseSearchStartedAt = null;
  for (let index = 0; index < maxSteps; index += 1) {
    stepFor(world, competentPilot(world));
    const elapsed = (index + 1) * STEP;
    const state = world.state;
    if (state.wave === 3 && elapsed >= PLAY_MIN_SECONDS) {
      if (denseSearchStartedAt === null) denseSearchStartedAt = elapsed;
    }
    if (denseSearchStartedAt !== null) {
      const playerBolts = state.bolts.filter((bolt) => bolt.owner === 'player').length;
      if (state.enemies.length >= 4 && playerBolts >= 2) return;
      if (elapsed - denseSearchStartedAt >= 45) return;
    }
    if (state.gameOver || state.victory) break;
  }
  throw new Error('Unable to stage an active play scene from the simulated world.');
}

function runLate(world) {
  const maxSteps = SIMULATION_LIMIT / STEP;
  let waveSixStartedAt = null;
  for (let index = 0; index < maxSteps; index += 1) {
    stepFor(world, competentPilot(world));
    const elapsed = (index + 1) * STEP;
    const state = world.state;
    if (state.wave === 6) {
      if (waveSixStartedAt === null) waveSixStartedAt = elapsed;
      if (
        elapsed - waveSixStartedAt >= LATE_WAVE_SECONDS &&
        state.enemies.length > 0
      ) {
        return;
      }
    }
    if (state.gameOver || state.victory) break;
  }
  throw new Error('Unable to survive long enough to stage wave 6.');
}

function runEnd(world) {
  const maxSteps = SIMULATION_LIMIT / STEP;
  for (let index = 0; index < maxSteps; index += 1) {
    stepFor(world, recklessPilot(world));
    if (world.state.gameOver) return;
    if (world.state.victory) break;
  }
  throw new Error('The reckless pilot did not reach game over within 600 seconds.');
}

export function stageShot(name, world) {
  world.reset();
  const state = world.state;

  if (name === 'start' || name === 'title') {
    runAmbient(world);
    return { screen: SCREEN_TITLE, best: 0, state };
  }

  if (name === 'play') {
    runPlay(world);
    return { screen: SCREEN_PLAY, best: state.score, state };
  }

  if (name === 'late') {
    runLate(world);
    return { screen: SCREEN_PLAY, best: state.score, state };
  }

  runEnd(world);
  return { screen: SCREEN_OVER, best: state.score, state };
}
