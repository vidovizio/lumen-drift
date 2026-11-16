import { COMBO, FIELD, PLAYER, SHARD, STEP, WAVES } from './config.js';

export const EVENT_OVER = 1;
export const EVENT_VICTORY = 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function spawnParticles(state, x, y, color, count = 6, randomFn = Math.random) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + randomFn() * 0.8;
    const speed = 30 + randomFn() * 70;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.45 + randomFn() * 0.6,
      color,
      radius: 2 + randomFn() * 3,
    });
  }
}

function addText(state, x, y, text, color, randomFn = Math.random) {
  state.texts.push({ x, y, text, color, life: 1.2, drift: -14 - randomFn() * 8 });
}

function shootBolt(state, owner, x, y, angle, speed, damage) {
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  state.bolts.push({
    owner,
    x,
    y,
    vx,
    vy,
    radius: owner === 'player' ? 4 : 5,
    life: owner === 'player' ? 1.5 : 2.2,
    damage,
  });
}

function createEnemy(random, wave, type) {
  const edge = Math.floor(random() * 4);
  let x = 0;
  let y = 0;
  const padding = 120;
  if (edge === 0) {
    x = random() * FIELD.width;
    y = -padding;
  } else if (edge === 1) {
    x = FIELD.width + padding;
    y = random() * FIELD.height;
  } else if (edge === 2) {
    x = random() * FIELD.width;
    y = FIELD.height + padding;
  } else {
    x = -padding;
    y = random() * FIELD.height;
  }

  if (type === 'drifter') {
    return {
      type,
      x,
      y,
      radius: 18,
      maxHealth: 2 + Math.floor(wave / 2),
      health: 2 + Math.floor(wave / 2),
      speed: 75 + wave * 10,
      value: 100 + wave * 15,
      cooldown: 0.7 + random() * 0.6,
      phase: random() * Math.PI * 2,
    };
  }

  if (type === 'weaver') {
    return {
      type,
      x,
      y,
      radius: 20,
      maxHealth: 3 + Math.floor(wave / 2),
      health: 3 + Math.floor(wave / 2),
      speed: 58 + wave * 9,
      value: 180 + wave * 20,
      cooldown: 1.1 + random() * 0.9,
      phase: random() * Math.PI * 2,
    };
  }

  if (type === 'bulwark') {
    return {
      type,
      x,
      y,
      radius: 30,
      maxHealth: 8 + wave * 2,
      health: 8 + wave * 2,
      speed: 42 + wave * 5,
      value: 320 + wave * 35,
      cooldown: 1.5 + random() * 1.1,
      phase: random() * Math.PI * 2,
    };
  }

  return {
    type: 'maw',
    x,
    y,
    radius: 58,
    maxHealth: 28 + wave * 6,
    health: 28 + wave * 6,
    speed: 32 + wave * 3,
    value: 1100 + wave * 120,
    cooldown: 1.2,
    phase: random() * Math.PI * 2,
  };
}

function spawnShard(state, x, y, randomFn = Math.random) {
  const angle = randomFn() * Math.PI * 2;
  state.shards.push({
    x,
    y,
    vx: Math.cos(angle) * 30,
    vy: Math.sin(angle) * 30,
    radius: SHARD.radius,
    value: SHARD.value,
    life: 12,
  });
}

function knockback(state, x, y, amount) {
  const dx = state.player.x - x;
  const dy = state.player.y - y;
  const len = Math.hypot(dx, dy) || 1;
  state.player.x = clamp(state.player.x + (dx / len) * amount, 0, FIELD.width);
  state.player.y = clamp(state.player.y + (dy / len) * amount, 0, FIELD.height);
}

export function createWorld(random) {
  const state = {
    player: {
      x: FIELD.width / 2,
      y: FIELD.height * 0.72,
      radius: PLAYER.radius,
      angle: 0,
      hull: PLAYER.maxHull,
      maxHull: PLAYER.maxHull,
      invuln: 0,
      fireCooldown: 0,
    },
    enemies: [],
    bolts: [],
    shards: [],
    particles: [],
    texts: [],
    score: 0,
    combo: 1,
    comboTimer: 0,
    shardTotal: 0,
    wave: 1,
    waveBanner: 0,
    spawnQueue: [],
    spawnTimer: 0,
    gameOver: false,
    victory: false,
  };

  function beginWave(index) {
    const wave = Math.min(index, WAVES.length);
    const config = WAVES[wave - 1];
    const queue = [];
    for (let count = 0; count < config.count; count += 1) {
      queue.push(config.types[count % config.types.length]);
    }
    state.wave = wave;
    state.waveBanner = 2.2;
    state.spawnQueue = queue;
    state.spawnTimer = 0.5;
  }

  function reset() {
    state.player.x = FIELD.width / 2;
    state.player.y = FIELD.height * 0.72;
    state.player.radius = PLAYER.radius;
    state.player.angle = 0;
    state.player.hull = PLAYER.maxHull;
    state.player.maxHull = PLAYER.maxHull;
    state.player.invuln = 0;
    state.player.fireCooldown = 0;
    state.enemies = [];
    state.bolts = [];
    state.shards = [];
    state.particles = [];
    state.texts = [];
    state.score = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.shardTotal = 0;
    state.gameOver = false;
    state.victory = false;
    state.wave = 1;
    state.waveBanner = 2;
    state.spawnQueue = [];
    state.spawnTimer = 0;
    beginWave(1);
  }

  const rng = random;

  function damagePlayer(amount) {
    if (state.player.invuln > 0) return false;
    state.player.hull = clamp(state.player.hull - amount, 0, state.player.maxHull);
    state.player.invuln = 0.7;
    addText(state, state.player.x, state.player.y - 8, `-${amount}`, '#ff7e9a', rng);
    if (state.player.hull <= 0) {
      state.gameOver = true;
      addText(state, state.player.x, state.player.y - 30, 'Hull broken', '#ff6f8c', rng);
      return true;
    }
    return false;
  }

  function tryWin() {
    if (state.wave === WAVES.length && state.enemies.length === 0 && state.spawnQueue.length === 0) {
      state.victory = true;
      return true;
    }
    if (state.enemies.length === 0 && state.spawnQueue.length === 0 && state.wave < WAVES.length) {
      beginWave(state.wave + 1);
    }
    return false;
  }

  function finishEnemy(enemy) {
    state.enemies = state.enemies.filter((entry) => entry !== enemy);
    const gain = Math.round(enemy.value * state.combo);
    addText(state, enemy.x, enemy.y - 10, `+${gain}`, '#8ef5ff', rng);
    state.score += gain;
    spawnParticles(state, enemy.x, enemy.y, '#ffd0ff', 10, rng);

    if (enemy.type === 'bulwark') {
      const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x) || 0;
      for (const offset of [-1, 1]) {
        const child = createEnemy(rng, state.wave, 'drifter');
        child.x = enemy.x + Math.cos(angle + offset * 0.9) * (enemy.radius + 20);
        child.y = enemy.y + Math.sin(angle + offset * 0.9) * (enemy.radius + 20);
        state.enemies.push(child);
      }
    }

    for (let index = 0; index < (enemy.type === 'maw' ? 8 : 3); index += 1) {
      spawnShard(state, enemy.x, enemy.y, rng);
    }

    if (state.enemies.length === 0 && state.spawnQueue.length === 0) {
      tryWin();
    }
  }

  function firePlayer(aim) {
    if (state.player.fireCooldown > 0) return;
    const angle = Math.atan2(aim.y - state.player.y, aim.x - state.player.x);
    shootBolt(state, 'player', state.player.x + Math.cos(angle) * 20, state.player.y + Math.sin(angle) * 20, angle, 640, 1);
    state.player.fireCooldown = PLAYER.fireCooldown;
  }

  function fireEnemy(enemy) {
    const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
    shootBolt(state, 'enemy', enemy.x + Math.cos(angle) * 18, enemy.y + Math.sin(angle) * 18, angle, enemy.type === 'maw' ? 210 : 170, enemy.type === 'maw' ? 12 : 9);
  }

  function step(dt, input = { moveVector: () => ({ x: 0, y: 0 }), aim: () => ({ x: FIELD.width / 2, y: FIELD.height / 2 }), firing: () => false }) {
    state.waveBanner = Math.max(0, state.waveBanner - dt);
    state.player.invuln = Math.max(0, state.player.invuln - dt);
    state.player.fireCooldown = Math.max(0, state.player.fireCooldown - dt);

    if (state.gameOver || state.victory) {
      for (let index = state.particles.length - 1; index >= 0; index -= 1) {
        const particle = state.particles[index];
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
        if (particle.life <= 0) state.particles.splice(index, 1);
      }
      for (let index = state.texts.length - 1; index >= 0; index -= 1) {
        const text = state.texts[index];
        text.y += text.drift * dt;
        text.life -= dt;
        if (text.life <= 0) state.texts.splice(index, 1);
      }
      return state.gameOver ? EVENT_OVER : EVENT_VICTORY;
    }

    const move = typeof input.moveVector === 'function' ? input.moveVector() : { x: 0, y: 0 };
    const aim = typeof input.aim === 'function' ? input.aim() : { x: state.player.x, y: state.player.y };
    const firing = typeof input.firing === 'function' ? input.firing() : false;
    const velocityX = move.x * PLAYER.speed;
    const velocityY = move.y * PLAYER.speed;
    state.player.x = clamp(state.player.x + velocityX * dt, 0 + state.player.radius, FIELD.width - state.player.radius);
    state.player.y = clamp(state.player.y + velocityY * dt, 0 + state.player.radius, FIELD.height - state.player.radius);
    state.player.angle = Math.atan2(aim.y - state.player.y, aim.x - state.player.x);

    if (firing) {
      firePlayer(aim);
    }

    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const nextType = state.spawnQueue.shift();
        state.enemies.push(createEnemy(random, state.wave, nextType));
        state.spawnTimer = clamp(1.3 - state.wave * 0.08, 0.35, 1.1);
      }
    }

    for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = state.enemies[index];
      enemy.phase += dt;
      const dx = state.player.x - enemy.x;
      const dy = state.player.y - enemy.y;
      const norm = Math.hypot(dx, dy) || 1;
      let vx = (dx / norm) * enemy.speed;
      let vy = (dy / norm) * enemy.speed;

      if (enemy.type === 'weaver') {
        const drift = Math.sin(enemy.phase * 2.8 + enemy.x * 0.02) * 35;
        vx += -dy / norm * drift;
        vy += dx / norm * drift;
      }

      if (enemy.type === 'bulwark') {
        vx *= 0.82;
        vy *= 0.82;
      }

      enemy.x += vx * dt;
      enemy.y += vy * dt;
      enemy.cooldown -= dt;

      if (enemy.cooldown <= 0 && (enemy.type === 'weaver' || enemy.type === 'maw')) {
        fireEnemy(enemy);
        enemy.cooldown = enemy.type === 'maw' ? 1.4 : 1.8 + rng() * 0.6;
      }

      if (distance(enemy.x, enemy.y, state.player.x, state.player.y) < enemy.radius + state.player.radius + 4) {
        if (damagePlayer(enemy.type === 'maw' ? 18 : enemy.type === 'bulwark' ? 14 : 9)) {
          return EVENT_OVER;
        }
        knockback(state, enemy.x, enemy.y, 18);
      }
    }

    for (let index = state.bolts.length - 1; index >= 0; index -= 1) {
      const bolt = state.bolts[index];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;

      if (bolt.life <= 0 || bolt.x < -30 || bolt.x > FIELD.width + 30 || bolt.y < -30 || bolt.y > FIELD.height + 30) {
        state.bolts.splice(index, 1);
        continue;
      }

      if (bolt.owner === 'player') {
        let hit = false;
        for (let e = 0; e < state.enemies.length; e += 1) {
          const enemy = state.enemies[e];
          if (distance(bolt.x, bolt.y, enemy.x, enemy.y) <= enemy.radius + bolt.radius) {
            enemy.health -= bolt.damage;
            state.bolts.splice(index, 1);
            hit = true;
            if (enemy.health <= 0) {
              finishEnemy(enemy);
            } else {
              addText(state, enemy.x, enemy.y - 12, '-1', '#ffb1d8', rng);
            }
            break;
          }
        }
        if (hit) continue;
      } else if (distance(bolt.x, bolt.y, state.player.x, state.player.y) <= state.player.radius + bolt.radius) {
        if (damagePlayer(bolt.damage)) {
          return EVENT_OVER;
        }
        state.bolts.splice(index, 1);
      }
    }

    for (let index = state.shards.length - 1; index >= 0; index -= 1) {
      const shard = state.shards[index];
      const dx = state.player.x - shard.x;
      const dy = state.player.y - shard.y;
      const length = Math.hypot(dx, dy) || 1;
      if (length < SHARD.magnet) {
        shard.vx += (dx / length) * 105 * dt;
        shard.vy += (dy / length) * 105 * dt;
      }
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.life -= dt;

      if (length < shard.radius + state.player.radius + 5) {
        const valueGain = Math.round(shard.value * state.combo);
        state.score += valueGain;
        state.combo = clamp(state.combo + COMBO.pickupBoost, COMBO.min, COMBO.max);
        state.comboTimer = 2.8;
        state.shardTotal += 1;
        if (state.shardTotal % 20 === 0) {
          state.player.hull = clamp(state.player.hull + 12, 0, state.player.maxHull);
          addText(state, state.player.x, state.player.y - 10, '+hull', '#8ef5ff', rng);
        }
        state.shards.splice(index, 1);
        addText(state, shard.x, shard.y - 10, `+${valueGain}`, '#71f6ff', rng);
        spawnParticles(state, shard.x, shard.y, '#7feaff', 7, rng);
        continue;
      }

      if (shard.life <= 0) {
        state.shards.splice(index, 1);
      }
    }

    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
    } else if (state.combo > COMBO.min) {
      state.combo = Math.max(COMBO.min, state.combo - COMBO.decay * dt);
    }

    for (let index = state.particles.length - 1; index >= 0; index -= 1) {
      const particle = state.particles[index];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(index, 1);
    }

    for (let index = state.texts.length - 1; index >= 0; index -= 1) {
      const text = state.texts[index];
      text.y += text.drift * dt;
      text.life -= dt;
      if (text.life <= 0) state.texts.splice(index, 1);
    }

    if (state.enemies.length === 0 && state.spawnQueue.length === 0 && !state.gameOver && !state.victory) {
      tryWin();
    }

    return state.gameOver ? EVENT_OVER : state.victory ? EVENT_VICTORY : 0;
  }

  reset();
  return { state, reset, step };
}
