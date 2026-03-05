'use strict';

// ---- Constants ----
const CANVAS_W = 360;
const CANVAS_H = 640;

const POLE_WIDTH = 14;
const BOLT_WIDTH = 28;
const BOLT_HEIGHT = 8;
const BOLT_SPACING = 72; // world-px between bolts vertically (worldY increases upward)
const BOLT_POOL = 30;    // bolts to keep generated ahead

// 36 world-px = 1 meter  (bolt spacing 72px = 2m per bolt, ~10 bolts to reach 20m)
const PX_PER_M = 36;

function getTimeLimit(heightM) {
  if (heightM < 20)  return 2.0;
  if (heightM < 50)  return 1.5;
  if (heightM < 100) return 1.2;
  if (heightM < 200) return 1.0;
  return 0.7;
}

// ---- World coordinate helpers ----
// worldY: 0 = start, positive = upward
// screenY = CANVAS_H - (worldY - cameraBottom)
// cameraBottom = world Y at bottom of screen

// ---- Bolt ----
class Bolt {
  constructor(index, side) {
    this.index = index;
    this.side  = side;   // 'left' | 'right'
    this.worldY = index * BOLT_SPACING;
    this.worldX = this._calcWorldX();
  }

  _calcWorldX() {
    const cx = CANVAS_W / 2;
    if (this.side === 'left') return cx - POLE_WIDTH / 2 - BOLT_WIDTH / 2;
    return cx + POLE_WIDTH / 2 + BOLT_WIDTH / 2;
  }
}

// ---- Game ----
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resizeCanvas();

    this.ui     = new UI(this.canvas, this.ctx);
    this.player = new Player(this.canvas);

    this.state  = 'title'; // 'title' | 'playing' | 'paused' | 'gameover'

    // Camera: world Y at bottom edge of canvas
    this.cameraBottom = 0;
    this.cameraTarget = 0;

    // Game state
    this.bolts          = [];
    this.currentBoltIdx = 0;
    this.heightM        = 0;
    this.score          = 0;
    this.combo          = 0;
    this.multiplier     = 1;
    this.highScore      = parseInt(localStorage.getItem('tpj_high') || '0', 10);

    this.timeLeft  = 2.0;
    this.timeMax   = 2.0;
    this.deathTimer = 0;
    this.isNewRecord = false;

    this.animTick = 0;
    this.selectedSide = 'left';
    this.swipeStartX  = null;

    this._bindInput();

    this.lastTime = null;
    requestAnimationFrame((t) => this._loop(t));
  }

  // ---- Canvas sizing ----
  _resizeCanvas() {
    const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    this.canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
  }

  // ---- Coordinate conversions ----
  worldToScreenY(worldY) {
    return CANVAS_H - (worldY - this.cameraBottom);
  }

  screenToWorldY(screenY) {
    return (CANVAS_H - screenY) + this.cameraBottom;
  }

  // ---- Input ----
  _bindInput() {
    window.addEventListener('keydown', (e) => this._onKey(e));

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.swipeStartX = t.clientX;
      this._onTap(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.swipeStartX === null) return;
      const dx = e.touches[0].clientX - this.swipeStartX;
      if (Math.abs(dx) > 20) {
        this.selectedSide = dx < 0 ? 'left' : 'right';
        this.swipeStartX = e.touches[0].clientX;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.swipeStartX = null;
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top)  * scaleY;
      this._onTap(e.clientX, e.clientY, cx, cy);
    });

    window.addEventListener('resize', () => {
      this._resizeCanvas();
      this.ui.resize();
    });
  }

  _onTap(clientX, clientY, canvasX, canvasY) {
    if (this.state === 'title') { this._startGame(); return; }

    if (this.state === 'gameover') {
      // Convert if not already
      if (canvasX === undefined) {
        const rect = this.canvas.getBoundingClientRect();
        canvasX = (clientX - rect.left) * (CANVAS_W / rect.width);
        canvasY = (clientY - rect.top)  * (CANVAS_H / rect.height);
      }
      this._handleGameOverClick(canvasX, canvasY);
      return;
    }

    if (this.state === 'paused') { this.state = 'playing'; return; }

    if (this.state === 'playing' && !this.player.jumping && !this.player.sliding) {
      this._doJump();
    }
  }

  _handleGameOverClick(cx, cy) {
    const r = this.ui.retryBtnRect;
    const t = this.ui.titleBtnRect;
    if (r && cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
      this._startGame();
    } else if (t && cx >= t.x && cx <= t.x + t.w && cy >= t.y && cy <= t.y + t.h) {
      this.state = 'title';
    } else {
      this._startGame();
    }
  }

  _onKey(e) {
    if (this.state === 'title') {
      if (e.code === 'Space' || e.code === 'Enter') { this._startGame(); return; }
    }
    if (this.state === 'gameover') {
      if (e.code === 'Space' || e.code === 'Enter') { this._startGame(); return; }
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.state = this.state === 'playing' ? 'paused' : 'playing';
      return;
    }
    if (this.state !== 'playing') return;

    if (e.code === 'ArrowLeft')  this.selectedSide = 'left';
    if (e.code === 'ArrowRight') this.selectedSide = 'right';
    if (e.code === 'Space') {
      e.preventDefault();
      if (!this.player.jumping && !this.player.sliding) this._doJump();
    }
  }

  // ---- Game Lifecycle ----
  _startGame() {
    this.state          = 'playing';
    this.bolts          = [];
    this.currentBoltIdx = 0;
    this.heightM        = 0;
    this.score          = 0;
    this.combo          = 0;
    this.multiplier     = 1;
    this.isNewRecord    = false;
    this.deathTimer     = 0;

    this._generateBolts(BOLT_POOL);

    const startBolt   = this.bolts[0];
    this.selectedSide = startBolt.side;

    // Camera: show start bolt at 65% down the screen
    const targetScreenY = CANVAS_H * 0.65;
    this.cameraBottom   = startBolt.worldY - (CANVAS_H - targetScreenY);
    this.cameraTarget   = this.cameraBottom;

    // Place player on start bolt (world coords)
    this.player.reset();
    this.player.worldX   = startBolt.worldX;
    this.player.worldY   = startBolt.worldY;
    this.player.facingRight = startBolt.side === 'right';

    this.timeMax  = getTimeLimit(0);
    this.timeLeft = this.timeMax;
  }

  _generateBolts(count) {
    let prevSide = Math.random() < 0.5 ? 'left' : 'right';
    for (let i = 0; i < count; i++) {
      let side;
      if (i === 0) {
        side = prevSide; // first bolt: just pick initial side
      } else {
        // 80% chance to alternate
        side = Math.random() < 0.8
          ? (prevSide === 'left' ? 'right' : 'left')
          : prevSide;
      }
      this.bolts.push(new Bolt(i, side));
      prevSide = side;
    }
  }

  _ensureBoltsAhead() {
    while (this.bolts.length < this.currentBoltIdx + BOLT_POOL) {
      const last = this.bolts[this.bolts.length - 1];
      const side = Math.random() < 0.8
        ? (last.side === 'left' ? 'right' : 'left')
        : last.side;
      this.bolts.push(new Bolt(last.index + 1, side));
    }
  }

  // ---- Jump ----
  _doJump() {
    const cur  = this.bolts[this.currentBoltIdx];
    const next = this.bolts[this.currentBoltIdx + 1];
    if (!cur || !next) return;

    // Jump in world coordinates
    this.player.startJump(
      cur.worldX,  cur.worldY,
      next.worldX, next.worldY
    );
    this.currentBoltIdx++;
    this._ensureBoltsAhead();

    // Score
    this.combo++;
    const comboBonus = this.combo >= 5 ? 1.5 : this.combo >= 3 ? 1.2 : 1.0;
    this.score += Math.floor(5 * this.multiplier * comboBonus);

    // Height in meters
    this.heightM = Math.floor(next.worldY / PX_PER_M);

    // Reset timer with new difficulty
    this.timeMax  = getTimeLimit(this.heightM);
    this.timeLeft = this.timeMax;
  }

  // ---- Death ----
  _triggerDeath() {
    if (this.player.sliding) return;
    this.player.startSlide();
    this.combo    = 0;
    this.deathTimer = 1800;

    if (this.heightM > this.highScore) {
      this.highScore   = this.heightM;
      this.isNewRecord = true;
      localStorage.setItem('tpj_high', this.highScore);
    }
  }

  // ---- Update ----
  _update(dt) {
    if (this.state !== 'playing') return;

    this.player.update(dt);

    // Timer (only while idle on bolt)
    if (!this.player.jumping && !this.player.sliding) {
      this.timeLeft -= dt / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._triggerDeath();
      }
    }

    // Camera tracks player smoothly
    const cur = this.bolts[this.currentBoltIdx];
    if (cur) {
      // Target: current bolt at 65% down from top
      const targetScreenY = CANVAS_H * 0.65;
      this.cameraTarget = cur.worldY - (CANVAS_H - targetScreenY);
    }
    // Smooth follow
    this.cameraBottom += (this.cameraTarget - this.cameraBottom) * 0.1;

    // Death animation timer
    if (this.player.sliding) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.state = 'gameover';
      }
    }
  }

  // ---- Draw ----
  _draw() {
    const ctx = this.ctx;

    if (this.state === 'title') {
      this.ui.drawTitle(this.highScore, this.animTick);
      return;
    }

    this._drawBackground();
    this._drawPole();
    this._drawBolts();
    this._drawPlayer();

    if (this.state === 'playing' || this.state === 'paused') {
      this.ui.drawHUD(this.heightM, this.score, this.highScore,
                      this.timeLeft, this.timeMax, this.combo);
    }
    if (this.state === 'paused') {
      this.ui.drawPause();
    }
    if (this.state === 'gameover') {
      this.ui.drawGameOver(this.heightM, this.score, this.highScore, this.isNewRecord);
    }
  }

  _drawBackground() {
    const ctx = this.ctx;
    const W = CANVAS_W, H = CANVAS_H;
    const hm = this.heightM;

    let c0, c1;
    if (hm < 50)       { c0 = '#ff7722'; c1 = '#ffcc88'; }
    else if (hm < 100) { c0 = '#334466'; c1 = '#8899bb'; }
    else if (hm < 200) { c0 = '#aaccff'; c1 = '#ffffff'; }
    else               { c0 = '#000011'; c1 = '#111144'; }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (hm < 50)       this._drawStreetBg();
    else if (hm < 100) this._drawRooftopBg();
    else if (hm < 200) this._drawCloudBg();
    else               this._drawSpaceBg();
  }

  _drawStreetBg() {
    const ctx = this.ctx;
    const H = CANVAS_H;
    // Left building
    ctx.fillStyle = '#5a3311';
    ctx.fillRect(0, H * 0.45, 65, H * 0.55);
    // Right building
    ctx.fillRect(CANVAS_W - 72, H * 0.5, 72, H * 0.5);
    // Windows
    ctx.fillStyle = '#ffee88';
    for (let wy = H * 0.5; wy < H - 10; wy += 16) {
      for (let wx = 6; wx < 58; wx += 16) ctx.fillRect(wx, wy, 7, 9);
      for (let wx = CANVAS_W - 66; wx < CANVAS_W - 6; wx += 16) ctx.fillRect(wx, wy, 7, 9);
    }
  }

  _drawRooftopBg() {
    const ctx = this.ctx;
    const H = CANVAS_H;
    ctx.fillStyle = '#223355';
    ctx.fillRect(0, H * 0.6, 75, H * 0.4);
    ctx.fillRect(CANVAS_W - 68, H * 0.65, 68, H * 0.35);
    // TV antenna
    ctx.strokeStyle = '#557';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, H * 0.6);
    ctx.lineTo(30, H * 0.6 - 22);
    ctx.moveTo(18, H * 0.6 - 18);
    ctx.lineTo(42, H * 0.6 - 18);
    ctx.stroke();
  }

  _drawCloudBg() {
    const ctx = this.ctx;
    const H = CANVAS_H;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    this._cloud(35, H * 0.3, 55);
    this._cloud(CANVAS_W - 65, H * 0.5, 48);
    this._cloud(18, H * 0.72, 38);
  }

  _cloud(x, y, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x,          y,          r * 0.5,  0, Math.PI * 2);
    ctx.arc(x + r * 0.4, y - r * 0.1, r * 0.35, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y,          r * 0.4,  0, Math.PI * 2);
    ctx.fill();
  }

  _drawSpaceBg() {
    const ctx = this.ctx;
    const W = CANVAS_W, H = CANVAS_H;
    ctx.fillStyle = '#fff';
    [[20,40],[60,80],[100,20],[140,90],[200,35],[280,60],[320,110],
     [30,200],[310,300],[50,400],[330,500],[80,550],[250,150],[170,480]]
      .forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));

    // Earth
    const eg = ctx.createRadialGradient(W - 30, H - 30, 5, W - 30, H - 30, 40);
    eg.addColorStop(0,   '#4488ff');
    eg.addColorStop(0.6, '#2244aa');
    eg.addColorStop(1,   'transparent');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(W - 30, H - 30, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawPole() {
    const ctx = this.ctx;
    const cx = CANVAS_W / 2;
    const H  = CANVAS_H;

    ctx.fillStyle = '#4a3728';
    ctx.fillRect(cx - POLE_WIDTH / 2, 0, POLE_WIDTH, H);
    // Texture
    ctx.fillStyle = '#3a2718';
    for (let y = 0; y < H; y += 22) ctx.fillRect(cx - POLE_WIDTH / 2 + 2, y, 2, 11);
    // Highlight
    ctx.fillStyle = '#5a4738';
    ctx.fillRect(cx - POLE_WIDTH / 2, 0, 3, H);
  }

  _drawBolts() {
    const ctx = this.ctx;
    const cx  = CANVAS_W / 2;

    for (const bolt of this.bolts) {
      const sy = this.worldToScreenY(bolt.worldY);
      if (sy < -30 || sy > CANVAS_H + 30) continue;

      const isCurrent = bolt.index === this.currentBoltIdx;
      const isNext    = bolt.index === this.currentBoltIdx + 1;

      // Horizontal arm from pole
      ctx.fillStyle = '#777';
      if (bolt.side === 'left') {
        ctx.fillRect(cx - POLE_WIDTH / 2 - BOLT_WIDTH, sy - 5, BOLT_WIDTH, 4);
      } else {
        ctx.fillRect(cx + POLE_WIDTH / 2, sy - 5, BOLT_WIDTH, 4);
      }

      // Bolt platform
      ctx.fillStyle = isCurrent ? '#ffdd44' : (isNext ? '#88ccff' : '#999');
      ctx.fillRect(bolt.worldX - BOLT_WIDTH / 2, sy - BOLT_HEIGHT, BOLT_WIDTH, BOLT_HEIGHT);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(bolt.worldX - BOLT_WIDTH / 2 + 2, sy, BOLT_WIDTH - 2, 3);

      // Arrow indicator for next bolt
      if (isNext) {
        ctx.save();
        ctx.fillStyle = '#ffff44';
        ctx.font = 'bold 13px "Courier New"';
        ctx.textAlign = 'center';
        const arrowX = bolt.side === 'left'
          ? cx - POLE_WIDTH / 2 - BOLT_WIDTH - 14
          : cx + POLE_WIDTH / 2 + BOLT_WIDTH + 14;
        ctx.fillText(bolt.side === 'left' ? '◀' : '▶', arrowX, sy - 1);
        ctx.restore();
      }
    }
  }

  _drawPlayer() {
    // Convert player world position to screen
    const sx = this.player.worldX;
    const sy = this.worldToScreenY(this.player.worldY);
    this.player.draw(this.ctx, sx, sy);
  }

  // ---- Loop ----
  _loop(timestamp) {
    const dt = this.lastTime ? Math.min(timestamp - this.lastTime, 50) : 16;
    this.lastTime = timestamp;
    this.animTick++;
    this._update(dt);
    this._draw();
    requestAnimationFrame((t) => this._loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => { new Game(); });
