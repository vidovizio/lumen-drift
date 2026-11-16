import { FIELD, FONT, PALETTE } from './config.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'gameover';
export const SCREEN_VICTORY = 'victory';

const STAR_COUNT = 140;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cachedLabel(prefix) {
  let current = -1;
  let labelText = '';
  return function update(value) {
    if (value !== current) {
      current = value;
      labelText = `${prefix}${value}`;
    }
    return labelText;
  };
}

export function createRenderer(canvas, randomSource = createRandom(1337)) {
  const context = canvas.getContext('2d');
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: randomSource() * FIELD.width,
    y: randomSource() * FIELD.height,
    r: 1 + randomSource() * 2.2,
    alpha: 0.2 + randomSource() * 0.8,
  }));
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const comboLabel = cachedLabel('Combo x');
  const waveLabel = cachedLabel('Wave ');
  const shardsLabel = cachedLabel('Shards ');
  const hullLabel = cachedLabel('Hull ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function setFont(size) {
    context.font = `${size}px ${FONT}`;
  }

  function writeText(value, x, y, size, color, align = 'left') {
    setFont(size);
    context.textAlign = align;
    context.fillStyle = color;
    context.fillText(value, x, y);
  }

  function drawBackground(state) {
    context.fillStyle = '#040a14';
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    for (const star of stars) {
      const driftX = ((state.player.x * 0.12) + star.x * 0.8) % (FIELD.width + 40);
      const driftY = ((state.player.y * 0.08) + star.y * 0.5) % (FIELD.height + 40);
      context.fillStyle = `rgba(160, 220, 255, ${star.alpha})`;
      context.fillRect(driftX, driftY, star.r, star.r);
    }

    context.strokeStyle = PALETTE.gridA;
    context.lineWidth = 1;
    const offsetX = (state.player.x * 0.18) % 48;
    const offsetY = (state.player.y * 0.15) % 48;
    for (let x = -48; x <= FIELD.width + 48; x += 48) {
      context.beginPath();
      context.moveTo(x - offsetX, 0);
      context.lineTo(x - offsetX, FIELD.height);
      context.stroke();
    }
    for (let y = -48; y <= FIELD.height + 48; y += 48) {
      context.beginPath();
      context.moveTo(0, y - offsetY);
      context.lineTo(FIELD.width, y - offsetY);
      context.stroke();
    }
  }

  function drawEnemy(enemy) {
    context.save();
    context.translate(enemy.x, enemy.y);
    context.rotate(enemy.phase * 0.6);

    if (enemy.type === 'drifter') {
      context.fillStyle = PALETTE.enemyDrifter;
      context.shadowColor = PALETTE.enemyDrifter;
      context.shadowBlur = 18;
      context.beginPath();
      context.moveTo(0, -enemy.radius);
      context.lineTo(enemy.radius, 0);
      context.lineTo(0, enemy.radius);
      context.lineTo(-enemy.radius, 0);
      context.closePath();
      context.fill();
    } else if (enemy.type === 'weaver') {
      context.strokeStyle = PALETTE.enemyWeaver;
      context.fillStyle = 'rgba(255, 179, 71, 0.2)';
      context.lineWidth = 3;
      context.shadowColor = PALETTE.enemyWeaver;
      context.shadowBlur = 14;
      context.beginPath();
      context.arc(0, 0, enemy.radius, Math.PI * 0.7, Math.PI * 2.4);
      context.stroke();
      context.beginPath();
      context.arc(0, 0, enemy.radius * 0.8, Math.PI * 1.3, Math.PI * 3.8);
      context.fill();
    } else if (enemy.type === 'bulwark') {
      context.fillStyle = PALETTE.enemyBulwark;
      context.strokeStyle = 'rgba(72, 240, 211, 0.75)';
      context.shadowColor = PALETTE.enemyBulwark;
      context.shadowBlur = 18;
      context.lineWidth = 2.5;
      context.beginPath();
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6 - Math.PI / 6;
        const x = Math.cos(angle) * enemy.radius;
        const y = Math.sin(angle) * enemy.radius;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      context.stroke();
    } else {
      context.fillStyle = PALETTE.enemyMaw;
      context.strokeStyle = '#ffb4d4';
      context.lineWidth = 3;
      context.shadowColor = PALETTE.enemyMaw;
      context.shadowBlur = 24;
      context.beginPath();
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8 - Math.PI / 8;
        const x = Math.cos(angle) * enemy.radius;
        const y = Math.sin(angle) * enemy.radius;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = '#ffecf4';
      context.beginPath();
      context.arc(0, -enemy.radius * 0.2, enemy.radius * 0.18, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();

    const ratio = clamp(enemy.health / enemy.maxHealth, 0, 1);
    context.fillStyle = 'rgba(10, 15, 23, 0.8)';
    context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 18, enemy.radius * 2, 6);
    context.fillStyle = enemy.type === 'maw' ? '#ff9dbd' : '#7ef3ff';
    context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 18, enemy.radius * 2 * ratio, 6);
  }

  function drawPlayer(player) {
    const angle = player.angle;
    context.save();
    context.translate(player.x, player.y);
    context.rotate(angle);
    context.shadowColor = PALETTE.playerGlow;
    context.shadowBlur = 18;
    context.beginPath();
    context.moveTo(20, 0);
    context.lineTo(-16, -12);
    context.lineTo(-8, 0);
    context.lineTo(-16, 12);
    context.closePath();
    context.fillStyle = player.invuln > 0 && Math.floor(player.invuln * 10) % 2 === 0 ? 'rgba(80, 90, 120, 0.5)' : PALETTE.player;
    context.fill();
    context.restore();

    context.strokeStyle = 'rgba(143, 247, 255, 0.7)';
    context.beginPath();
    context.moveTo(player.x, player.y);
    context.lineTo(player.x + Math.cos(angle) * 40, player.y + Math.sin(angle) * 40);
    context.stroke();
  }

  function drawBolt(bolt) {
    context.strokeStyle = bolt.owner === 'player' ? PALETTE.bolt : '#ff8e8a';
    context.lineWidth = bolt.owner === 'player' ? 3 : 2.5;
    context.shadowBlur = 10;
    context.shadowColor = context.strokeStyle;
    context.beginPath();
    context.moveTo(bolt.x, bolt.y);
    context.lineTo(bolt.x - bolt.vx * 0.04, bolt.y - bolt.vy * 0.04);
    context.stroke();
  }

  function drawShard(shard) {
    context.beginPath();
    context.fillStyle = PALETTE.shard;
    context.shadowColor = PALETTE.shard;
    context.shadowBlur = 16;
    context.arc(shard.x, shard.y, shard.radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawParticles(particles) {
    for (const particle of particles) {
      context.beginPath();
      context.fillStyle = particle.color;
      context.shadowColor = particle.color;
      context.shadowBlur = 8;
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawTexts(texts) {
    for (const text of texts) {
      context.save();
      context.globalAlpha = clamp(text.life, 0, 1);
      writeText(text.text, text.x, text.y, 20, text.color, 'center');
      context.restore();
    }
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    writeText(scoreLabel(state.score), 28, 22, 26, PALETTE.text, 'left');
    writeText(comboLabel(Math.max(1, Math.round(state.combo))), 28, 60, 22, '#ffd96b', 'left');
    writeText(waveLabel(state.wave), FIELD.width / 2 - 40, 22, 24, PALETTE.text, 'left');
    writeText(shardsLabel(state.shardTotal), FIELD.width - 220, 22, 22, PALETTE.text, 'left');
    writeText(`Enemies ${state.enemies.length}`, FIELD.width - 220, 52, 18, '#d6eaff', 'left');

    const hullWidth = 220;
    const hullX = 28;
    const hullY = 100;
    const hullRatio = clamp(state.player.hull / state.player.maxHull, 0, 1);
    context.fillStyle = 'rgba(18, 25, 33, 0.9)';
    context.fillRect(hullX, hullY, hullWidth, 18);
    context.fillStyle = state.player.hull <= 25 ? PALETTE.hullWarn : PALETTE.hull;
    context.fillRect(hullX, hullY, hullWidth * hullRatio, 18);
    writeText(hullLabel(Math.round(state.player.hull)), hullX + hullWidth + 10, hullY - 2, 20, PALETTE.text, 'left');

    if (state.player.hull <= 25) {
      context.fillStyle = `rgba(255, 91, 127, ${0.3 + Math.sin(performance.now() / 90) * 0.25})`;
      context.fillRect(0, FIELD.height - 16, FIELD.width, 16);
    }

    if (state.waveBanner > 0) {
      const alpha = clamp(state.waveBanner / 2, 0, 1);
      context.fillStyle = `rgba(14, 18, 28, ${0.35 * alpha})`;
      context.fillRect(FIELD.width * 0.2, FIELD.height * 0.46, FIELD.width * 0.6, 80);
      writeText(`Wave ${state.wave}`, FIELD.width / 2, FIELD.height * 0.5 - 8, 36, PALETTE.text, 'center');
    }
  }

  function drawScreens(state, screen, best) {
    if (screen === SCREEN_TITLE) {
      context.fillStyle = 'rgba(11, 17, 25, 0.58)';
      context.fillRect(0, 0, FIELD.width, FIELD.height);
      context.fillStyle = '#dffaff';
      writeText('LUMEN DRIFT', FIELD.width / 2, 214, 62, '#ecfbff', 'center');
      writeText('Pilot the last Wisp.', FIELD.width / 2, 300, 28, '#a8d6ff', 'center');
      writeText('WASD / Arrows move • mouse aims • hold click or Space to fire', FIELD.width / 2, 348, 22, '#c9e8ff', 'center');
      writeText('Survive 8 waves and defeat the Maw.', FIELD.width / 2, 384, 22, '#c9e8ff', 'center');
      writeText('Click or press Enter to start', FIELD.width / 2, FIELD.height - 56, 24, '#8ef5ff', 'center');
      writeText(`Best ${best}`, FIELD.width / 2, 438, 20, '#ffd96b', 'center');
      return;
    }

    if (screen === SCREEN_PAUSED) {
      context.fillStyle = 'rgba(9, 14, 22, 0.6)';
      context.fillRect(0, 0, FIELD.width, FIELD.height);
      writeText('Paused', FIELD.width / 2, FIELD.height / 2 - 10, 52, '#ecfbff', 'center');
      writeText('Press P or Esc to resume', FIELD.width / 2, FIELD.height / 2 + 54, 22, '#bfe7ff', 'center');
      return;
    }

    if (screen === SCREEN_OVER) {
      context.fillStyle = 'rgba(15, 9, 14, 0.58)';
      context.fillRect(0, 0, FIELD.width, FIELD.height);
      writeText('Hull Breached', FIELD.width / 2, 220, 54, '#ffc0d6', 'center');
      writeText(`Score ${state.score}`, FIELD.width / 2, 310, 30, '#edfaff', 'center');
      writeText(`Wave ${state.wave}`, FIELD.width / 2, 350, 24, '#bfe7ff', 'center');
      writeText(`Best ${best}`, FIELD.width / 2, 392, 24, '#ffd76b', 'center');
      writeText('Click or press R / Enter to restart', FIELD.width / 2, FIELD.height - 56, 24, '#8ef5ff', 'center');
      return;
    }

    if (screen === SCREEN_VICTORY) {
      context.fillStyle = 'rgba(9, 17, 20, 0.6)';
      context.fillRect(0, 0, FIELD.width, FIELD.height);
      writeText('Victory', FIELD.width / 2, 220, 60, '#adf7db', 'center');
      writeText('The Maw is down. The last Wisp survives.', FIELD.width / 2, 294, 28, '#d9fff4', 'center');
      writeText(`Final score ${state.score}`, FIELD.width / 2, 340, 28, '#edfaff', 'center');
      writeText('Click or press R / Enter to play again', FIELD.width / 2, FIELD.height - 56, 24, '#8ef5ff', 'center');
    }
  }

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#040a14';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    drawBackground(state);
    for (const bolt of state.bolts) drawBolt(bolt);
    for (const shard of state.shards) drawShard(shard);
    for (const enemy of state.enemies) drawEnemy(enemy);
    drawPlayer(state.player);
    drawParticles(state.particles);
    drawTexts(state.texts);

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      drawHud(state);
    }

    if (screen === SCREEN_TITLE || screen === SCREEN_PAUSED || screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      drawScreens(state, screen, best);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
