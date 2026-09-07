'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Bala enemiga ──────────────────────────────────────────────────────────────
const EBULLET_SPEED = 300;   // px/s
const EBULLET_TTL   = 1.6;   // segundos de vida

class EnemyBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * EBULLET_SPEED;
    this.vy = Math.sin(angle) * EBULLET_SPEED;
    this.ttl    = EBULLET_TTL;
    this.radius = 2;
    this.dead   = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#f55';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-ups (Velocidad / Escudo) ────────────────────────────────────────────
const DROP_CHANCE    = 0.9;  // probabilidad de que un asteroide destruido suelte una cápsula
const POWERUP_TTL    = 9;     // segundos antes de desaparecer
const BOOST_DURATION = 5;     // segundos de empuje x2
const BOOST_FACTOR   = 2;     // multiplicador de empuje
const SHIELD_CHANCE  = 0.5;   // probabilidad de que la cápsula sea de Escudo
const SHIELD_MAX     = 3;     // impactos que absorbe el escudo
const SHIELD_RADIUS  = 22;    // radio del anillo de escudo alrededor de la nave

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = Math.random() < SHIELD_CHANCE ? 'shield' : 'speed';
    const angle = rand(0, Math.PI * 2);
    const speed = rand(25, 55);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rot      = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-1.5, 1.5);
    this.ttl      = POWERUP_TTL;
    this.radius   = 10;
    this.dead     = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por expirar
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const shield = this.type === 'shield';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = shield ? '#4f4' : '#0ff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Rombo giratorio
    ctx.save();
    ctx.rotate(this.rot);
    ctx.beginPath();
    ctx.moveTo(  0, -10);
    ctx.lineTo( 10,   0);
    ctx.lineTo(  0,  10);
    ctx.lineTo(-10,   0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    if (shield) {
      // Broche de escudo fijo en el centro
      ctx.beginPath();
      ctx.moveTo(   0, -5.5);
      ctx.lineTo( 4.5,   -3);
      ctx.lineTo( 4.5,  1.5);
      ctx.lineTo(   0,  5.5);
      ctx.lineTo(-4.5,  1.5);
      ctx.lineTo(-4.5,   -3);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Rayo fijo en el centro
      ctx.beginPath();
      ctx.moveTo(   2,  -5);
      ctx.lineTo(-2.5, 0.5);
      ctx.lineTo(-0.5, 0.5);
      ctx.lineTo(   -2,  5);
      ctx.lineTo( 2.5, -0.5);
      ctx.lineTo( 0.5, -0.5);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const STAR_POINTS    = 500;   // bono por destruir la estrella
const STAR_MIN_SPEED = 260;   // px/s
const STAR_MAX_SPEED = 340;   // px/s
const STAR_RADIUS    = 12;
const STAR_SPAWN_MIN = 8;     // segundos entre apariciones
const STAR_SPAWN_MAX = 15;
const STAR_MARGIN    = 30;    // margen fuera de pantalla

class ShootingStar {
  constructor() {
    // Nace fuera de un borde aleatorio y apunta a un punto del borde opuesto
    const m = STAR_MARGIN;
    const spots = [
      [rand(0, W), -m, rand(0, W), H + m],  // arriba → abajo
      [W + m, rand(0, H), -m, rand(0, H)],  // derecha → izquierda
      [rand(0, W), H + m, rand(0, W), -m],  // abajo → arriba
      [-m, rand(0, H), W + m, rand(0, H)],  // izquierda → derecha
    ];
    const [x, y, tx, ty] = spots[randInt(0, 3)];
    this.x = x;
    this.y = y;
    const angle = Math.atan2(ty - y, tx - x);
    const speed = rand(STAR_MIN_SPEED, STAR_MAX_SPEED);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rot      = rand(0, Math.PI * 2);
    this.rotSpeed = rand(2, 4);
    this.radius   = STAR_RADIUS;
    this.dead     = false;

    // Estrella regular de 5 puntas (radio externo/interno alternado)
    this.verts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? STAR_RADIUS : STAR_RADIUS * 0.42;
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    // Sin wrap(): cruza la pantalla una vez y sale
    this.x   += this.vx * dt;
    this.y   += this.vy * dt;
    this.rot += this.rotSpeed * dt;

    // Estela de chispas doradas
    if (Math.random() < 0.7)
      particles.push(new Particle(this.x, this.y, '255,213,74'));

    if (this.x < -STAR_MARGIN || this.x > W + STAR_MARGIN ||
        this.y < -STAR_MARGIN || this.y > H + STAR_MARGIN)
      this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── OVNI ──────────────────────────────────────────────────────────────────────
const UFO_POINTS     = 300;   // puntos por destruirlo
const UFO_RADIUS     = 16;
const UFO_SPEED      = 100;   // px/s de crucero
const UFO_TTL        = 12;    // segundos antes de retirarse
const UFO_TURN_EVERY = 1.5;   // segundos entre cambios de rumbo
const UFO_SHOOT_CD   = 1.2;   // segundos entre disparos
const UFO_SPREAD     = 0.35;  // rad de error de puntería base
const UFO_SPAWN_MIN  = 12;    // segundos entre apariciones
const UFO_SPAWN_MAX  = 18;
const UFO_FIRST_MIN  = 15;    // retardo de la primera aparición
const UFO_FIRST_MAX  = 25;
const UFO_MARGIN     = 30;    // margen fuera de pantalla

class Ufo {
  constructor() {
    // Nace fuera de un borde aleatorio, apuntando hacia el interior
    const m = UFO_MARGIN;
    const spots = [
      [-m, rand(0, H)],
      [W + m, rand(0, H)],
      [rand(0, W), -m],
      [rand(0, W), H + m],
    ];
    const [x, y] = spots[randInt(0, 3)];
    this.x = x;
    this.y = y;
    const tx = W / 2 + rand(-150, 150);
    const ty = H / 2 + rand(-150, 150);
    this.angle = Math.atan2(ty - y, tx - x);
    this.ttl        = UFO_TTL;
    this.t          = 0;
    this.turnTimer  = UFO_TURN_EVERY;
    this.shootTimer = rand(0.5, 1);
    this.radius     = UFO_RADIUS;
    this.dead       = false;
  }

  update(dt) {
    this.t   += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) {
      // Se retira con un destello
      this.dead = true;
      explode(this.x, this.y, 8, '255,85,85');
      return;
    }

    // Rumbo errático
    this.turnTimer -= dt;
    if (this.turnTimer <= 0) {
      this.angle += rand(-0.9, 0.9);
      this.turnTimer = UFO_TURN_EVERY;
    }

    this.x = wrap(this.x + Math.cos(this.angle) * UFO_SPEED * dt, W);
    this.y = wrap(this.y + Math.sin(this.angle) * UFO_SPEED * dt, H);

    // Bombardea a la nave con error de puntería (más preciso en niveles altos)
    if (!ship.dead) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = UFO_SHOOT_CD;
        const aim    = Math.atan2(ship.y - this.y, ship.x - this.x);
        const spread = Math.max(0.08, UFO_SPREAD - level * 0.03);
        enemyBullets.push(new EnemyBullet(this.x, this.y, aim + rand(-spread, spread)));
      }
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#f55';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Casco: trapecio
    ctx.beginPath();
    ctx.moveTo(-16, 6);
    ctx.lineTo( -7, -2);
    ctx.lineTo(  7, -2);
    ctx.lineTo( 16, 6);
    ctx.closePath();
    ctx.stroke();

    // Cúpula
    ctx.beginPath();
    ctx.arc(0, -2, 6, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Luz que recorre el casco
    const li = Math.floor(this.t * 6) % 3;
    ctx.beginPath();
    ctx.arc(-9 + li * 9, 2, 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.shield        = 0;
    this.shieldFlash   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.shieldFlash   > 0) this.shieldFlash   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const power = this.speedBoost > 0 ? THRUST * BOOST_FACTOR : THRUST;
      this.vx += Math.cos(this.angle) * power * dt;
      this.vy += Math.sin(this.angle) * power * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor (cyan mientras dura el power-up Velocidad)
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.speedBoost > 0
        ? 'rgba(0, 255, 255, 0.9)'
        : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    // Anillo de escudo: un arco por carga restante
    if (this.shield > 0) {
      const flash = this.shieldFlash > 0;
      ctx.strokeStyle = flash
        ? 'rgba(200, 255, 200, 0.95)'
        : `rgba(85, 255, 85, ${(0.3 + this.shield * 0.2).toFixed(2)})`;
      ctx.lineWidth = flash ? 2.5 : 1.5;
      for (let i = 0; i < this.shield; i++) {
        const a0 = (i / this.shield) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(0, 0, SHIELD_RADIUS, a0, a0 + (Math.PI * 2 / this.shield) - 0.5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, rgb = '255,255,255') {
    this.x  = x;
    this.y  = y;
    this.rgb = rgb;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.rgb},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, enemyBullets, asteroids, particles, powerUps, stars, ufos;
let starTimer, ufoTimer;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets       = [];
  enemyBullets  = [];
  asteroids     = [];
  particles     = [];
  powerUps      = [];
  stars         = [];
  ufos          = [];
  starTimer     = rand(STAR_SPAWN_MIN, STAR_SPAWN_MAX);
  ufoTimer      = rand(UFO_FIRST_MIN, UFO_FIRST_MAX);
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets       = [];
  enemyBullets  = [];
  particles     = [];
  powerUps      = [];
  stars         = [];
  ufos          = [];
  starTimer     = rand(STAR_SPAWN_MIN, STAR_SPAWN_MAX);
  ufoTimer      = rand(UFO_SPAWN_MIN, UFO_SPAWN_MAX);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, rgb) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, rgb));
}

function absorbHit(x, y) {
  ship.shield--;
  ship.shieldFlash = 0.25;
  // Al romperse la última carga el estallido es más grande
  explode(x, y, ship.shield === 0 ? 12 : 6, '85,255,85');
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedBoost = 0;
  ship.shield = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerUps.forEach(p => p.update(dt));
    stars.forEach(s => s.update(dt));
    ufos.forEach(u => u.update(dt));
    enemyBullets.forEach(b => b.update(dt));
    powerUps     = powerUps.filter(p => !p.dead);
    stars        = stars.filter(s => !s.dead);
    ufos         = ufos.filter(u => !u.dead);
    enemyBullets = enemyBullets.filter(b => !b.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  enemyBullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));
  stars.forEach(s => s.update(dt));
  ufos.forEach(u => u.update(dt));

  bullets       = bullets.filter(b => !b.dead);
  enemyBullets  = enemyBullets.filter(b => !b.dead);
  particles     = particles.filter(p => !p.dead);
  powerUps      = powerUps.filter(p => !p.dead);
  stars         = stars.filter(s => !s.dead);
  ufos          = ufos.filter(u => !u.dead);

  // Nave vs power-up
  for (const pu of powerUps) {
    if (!pu.dead && dist(ship, pu) < ship.radius + pu.radius) {
      pu.dead = true;
      if (pu.type === 'shield') {
        ship.shield = Math.min(SHIELD_MAX, ship.shield + 1);
        explode(pu.x, pu.y, 6, '85,255,85');
      } else {
        ship.speedBoost = BOOST_DURATION;
        explode(pu.x, pu.y, 6, '0,255,255');
      }
    }
  }

  // Aparición de la estrella fugaz (máx. 1 simultánea)
  starTimer -= dt;
  if (starTimer <= 0 && stars.length === 0) {
    stars.push(new ShootingStar());
    starTimer = rand(STAR_SPAWN_MIN, STAR_SPAWN_MAX);
  }

  // Aparición del OVNI (máx. 1 simultáneo)
  ufoTimer -= dt;
  if (ufoTimer <= 0 && ufos.length === 0) {
    ufos.push(new Ufo());
    ufoTimer = rand(UFO_SPAWN_MIN, UFO_SPAWN_MAX);
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        if (Math.random() < DROP_CHANCE) powerUps.push(new PowerUp(a.x, a.y));
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of stars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += STAR_POINTS;
        explode(s.x, s.y, 10, '255,213,74');
      }
    }
  }
  stars  = stars.filter(s => !s.dead);
  bullets = bullets.filter(b => !b.dead);

  // Bala del jugador vs OVNI
  for (const b of bullets) {
    for (const u of ufos) {
      if (!u.dead && !b.dead && dist(b, u) < u.radius) {
        b.dead = true;
        u.dead = true;
        score += UFO_POINTS;
        explode(u.x, u.y, 10, '255,85,85');
      }
    }
  }
  ufos    = ufos.filter(u => !u.dead);
  bullets = bullets.filter(b => !b.dead);

  // OVNI vs asteroide: ambos mueren y el asteroide se divide (sin puntos)
  const ufoSplits = [];
  for (const u of ufos) {
    for (const a of asteroids) {
      if (!u.dead && !a.dead && dist(u, a) < u.radius + a.radius * 0.82) {
        u.dead = true;
        a.dead = true;
        explode(u.x, u.y, 10, '255,85,85');
        explode(a.x, a.y, a.size * 5);
        ufoSplits.push(...a.split());
      }
    }
  }
  if (ufoSplits.length > 0) {
    asteroids = asteroids.filter(a => !a.dead).concat(ufoSplits);
    ufos      = ufos.filter(u => !u.dead);
  }

  // Bala enemiga vs escudo / nave
  if (ship.invincible <= 0 && !ship.dead) {
    for (const b of enemyBullets) {
      if (b.dead) continue;
      if (ship.shield > 0 && dist(b, ship) < SHIELD_RADIUS) {
        b.dead = true;
        absorbHit(b.x, b.y);
      } else if (dist(b, ship) < ship.radius + b.radius) {
        b.dead = true;
        killShip();
        break;
      }
    }
    enemyBullets = enemyBullets.filter(b => !b.dead);
  }

  // Nave vs asteroide / estrella fugaz / OVNI (el escudo absorbe el impacto)
  if (ship.invincible <= 0 && !ship.dead) {
    const hitAsteroid = asteroids.find(a => dist(ship, a) < ship.radius + a.radius * 0.82);
    if (hitAsteroid) {
      if (ship.shield > 0) {
        hitAsteroid.dead = true;
        score += POINTS[hitAsteroid.size];
        explode(hitAsteroid.x, hitAsteroid.y, hitAsteroid.size * 5);
        asteroids = asteroids.filter(a => !a.dead).concat(hitAsteroid.split());
        absorbHit(hitAsteroid.x, hitAsteroid.y);
      } else {
        killShip();
      }
    }

    if (!ship.dead) {
      const hitStar = stars.find(s => dist(ship, s) < ship.radius + s.radius * 0.82);
      if (hitStar) {
        if (ship.shield > 0) {
          hitStar.dead = true;
          score += STAR_POINTS;
          explode(hitStar.x, hitStar.y, 10, '255,213,74');
          absorbHit(hitStar.x, hitStar.y);
        } else {
          killShip();
        }
      }
    }

    if (!ship.dead) {
      const hitUfo = ufos.find(u => dist(ship, u) < ship.radius + u.radius);
      if (hitUfo) {
        if (ship.shield > 0) {
          hitUfo.dead = true;
          score += UFO_POINTS;
          explode(hitUfo.x, hitUfo.y, 10, '255,85,85');
          absorbHit(hitUfo.x, hitUfo.y);
        } else {
          killShip();
        }
      }
    }

    stars = stars.filter(s => !s.dead);
    ufos  = ufos.filter(u => !u.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawShieldIcon(x, y, active) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = active ? '#4f4' : 'rgba(85,255,85,0.3)';
  ctx.fillStyle   = 'rgba(85,255,85,0.25)';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(  0, -6);
  ctx.lineTo(  5,  -3);
  ctx.lineTo(  5, 1.5);
  ctx.lineTo(  0,   6);
  ctx.lineTo( -5, 1.5);
  ctx.lineTo( -5,  -3);
  ctx.closePath();
  if (active) ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  // Barra de tiempo restante del power-up Velocidad
  if (ship.speedBoost > 0) {
    const BW = 120, BH = 8;
    const bx = 14, by = 36;
    // Parpadeo en el último segundo
    const blink = ship.speedBoost < 1 && Math.floor(ship.speedBoost * 8) % 2 === 0;
    if (!blink) {
      // Marco
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, BW, BH);
      // Relleno cyan, se vacía de derecha a izquierda
      ctx.fillStyle = '#0ff';
      ctx.fillRect(bx + 1, by + 1, (BW - 2) * (ship.speedBoost / BOOST_DURATION), BH - 2);
    }
    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Cargas de escudo restantes (debajo de las vidas)
  if (ship.shield > 0) {
    for (let i = 0; i < SHIELD_MAX; i++)
      drawShieldIcon(W - 16 - i * 22, 42, i < ship.shield);
  }

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  stars.forEach(s => s.draw());
  ufos.forEach(u => u.draw());
  bullets.forEach(b => b.draw());
  enemyBullets.forEach(b => b.draw());
  powerUps.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
