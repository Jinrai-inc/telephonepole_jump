'use strict';

// ---- Constants ----
const CANVAS_W = 360;
const CANVAS_H = 640;

const POLE_WIDTH   = 14;
const BOLT_WIDTH   = 28;
const BOLT_HEIGHT  = 8;
const BOLT_SPACING = 72; // world-px between bolts (worldY increases upward)
const BOLT_POOL    = 30; // bolts to keep generated ahead

// 36 world-px = 1 meter  (bolt spacing 72px = 2m per bolt, ~10 bolts to reach 20m)
const PX_PER_M = 36;

// Difficulty: time limit based on current height
function getTimeLimit(heightM) {
  if (heightM < 20)  return 2.0;
  if (heightM < 50)  return 1.5;
  if (heightM < 100) return 1.2;
  if (heightM < 200) return 1.0;
  return 0.7;
}

// ---- World coordinate helpers ----
// worldY: 0 = start bolt, positive = upward
// screenY = CANVAS_H - (worldY - cameraBottom)
// cameraBottom = world Y at the bottom edge of the canvas

// ---- Bolt ----
class Bolt {
  constructor(index, side) {
    this.index  = index;
    this.side   = side;   // 'left' | 'right'
    this.worldY = index * BOLT_SPACING;
    this.worldX = this._calcWorldX();
  }

  _calcWorldX() {
    const cx = CANVAS_W / 2;
    return this.side === 'left'
      ? cx - POLE_WIDTH / 2 - BOLT_WIDTH / 2
      : cx + POLE_WIDTH / 2 + BOLT_WIDTH / 2;
  }
}

// ---- Notification popup --------------------------------------------------
// Brief floating text shown for events (crow penalty, dagashi pickup, combo)
class Notification {
  constructor(text, color, x, y) {
    this.text  = text;
    this.color = color;
    this.x     = x;
    this.y     = y;
    this.timer = 1100; // ms total
    this.max   = 1100;
  }

  update(dt) { this.timer -= dt; }
  get alive()  { return this.timer > 0; }

  draw(ctx) {
    const alpha = Math.min(1, this.timer / 300);
    const rise  = (this.max - this.timer) * 0.045;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 15px "Courier New"';
    ctx.fillStyle   = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 3;
    ctx.textAlign   = 'center';
    ctx.strokeText(this.text, this.x, this.y - rise);
    ctx.fillText(this.text,   this.x, this.y - rise);
    ctx.restore();
  }
}

// ---- Game ----------------------------------------------------------------
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resizeCanvas();

    this.ui        = new UI(this.canvas, this.ctx);
    this.player    = new Player(this.canvas);
    this.obstacles = new ObstacleManager();

    this.state = 'title'; // 'title' | 'playing' | 'paused' | 'gameover'

    // Camera
    this.cameraBottom = 0;
    this.cameraTarget = 0;

    // Game data
    this.bolts          = [];
    this.currentBoltIdx = 0;
    this.heightM        = 0;
    this.score          = 0;
    this.combo          = 0;
    this.highScore      = parseInt(localStorage.getItem('tpj_high') || '0', 10);

    // Dagashi multiplier
    this.multiplier      = 1;
    this.multiplierTimer = 0;   // ms remaining for ×2
    this.MULTIPLIER_DUR  = 5000; // 5 s

    // Timer
    this.timeLeft = 2.0;
    this.timeMax  = 2.0;

    // Death
    this.deathTimer  = 0;
    this.isNewRecord = false;

    // Crow warning flash
    this.crowWarning = false; // true when next bolt has a crow on its side

    // Notifications
    this.notifications = [];

    // Input
    this.animTick    = 0;
    this.selectedSide = 'left';
    this.swipeStartX  = null;

    // Jump landing detection
    this._playerWasJumping = false;

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
        this.swipeStartX  = e.touches[0].clientX;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.swipeStartX = null;
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      const rect   = this.canvas.getBoundingClientRect();
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
    if (this.state === 'title')  { this._startGame(); return; }
    if (this.state === 'paused') { this.state = 'playing'; return; }

    if (this.state === 'gameover') {
      if (canvasX === undefined) {
        const rect = this.canvas.getBoundingClientRect();
        canvasX = (clientX - rect.left) * (CANVAS_W / rect.width);
        canvasY = (clientY - rect.top)  * (CANVAS_H / rect.height);
      }
      this._handleGameOverClick(canvasX, canvasY);
      return;
    }

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
    this.multiplierTimer = 0;
    this.isNewRecord    = false;
    this.deathTimer     = 0;
    this.crowWarning    = false;
    this.notifications  = [];
    this._playerWasJumping = false;

    this.obstacles.reset();
    this._generateBolts(BOLT_POOL);

    const startBolt   = this.bolts[0];
    this.selectedSide = startBolt.side;

    // Camera: start bolt at 65 % down the screen
    const targetScreenY  = CANVAS_H * 0.65;
    this.cameraBottom    = startBolt.worldY - (CANVAS_H - targetScreenY);
    this.cameraTarget    = this.cameraBottom;

    this.player.reset();
    this.player.worldX       = startBolt.worldX;
    this.player.worldY       = startBolt.worldY;
    this.player.facingRight  = startBolt.side === 'right';

    this.timeMax  = getTimeLimit(0);
    this.timeLeft = this.timeMax;
  }

  // ---- Bolt generation ----
  _generateBolts(count) {
    let prevSide = Math.random() < 0.5 ? 'left' : 'right';
    for (let i = 0; i < count; i++) {
      const side = i === 0
        ? prevSide
        : (Math.random() < 0.8
            ? (prevSide === 'left' ? 'right' : 'left')
            : prevSide);
      const bolt = new Bolt(i, side);
      this.bolts.push(bolt);
      this.obstacles.onBoltGenerated(bolt, this.heightM);
      prevSide = side;
    }
  }

  _ensureBoltsAhead() {
    while (this.bolts.length < this.currentBoltIdx + BOLT_POOL) {
      const last = this.bolts[this.bolts.length - 1];
      const side = Math.random() < 0.8
        ? (last.side === 'left' ? 'right' : 'left')
        : last.side;
      const bolt = new Bolt(last.index + 1, side);
      this.bolts.push(bolt);
      this.obstacles.onBoltGenerated(bolt, this.heightM);
    }
  }

  // ---- Jump ----
  _doJump() {
    const cur  = this.bolts[this.currentBoltIdx];
    const next = this.bolts[this.currentBoltIdx + 1];
    if (!cur || !next) return;

    // Check crow penalty BEFORE moving currentBoltIdx
    const hasCrow = this.obstacles.crowOnSide(next.side, cur.worldY);
    if (hasCrow) {
      this.timeLeft = Math.max(0.05, this.timeLeft - 0.3);
      this._notify('カラス！ -0.3s', '#ff4400',
        CANVAS_W / 2, CANVAS_H * 0.38);
    }

    // Jump
    this.player.startJump(cur.worldX, cur.worldY, next.worldX, next.worldY);
    this.currentBoltIdx++;
    this._ensureBoltsAhead();

    // Height
    this.heightM = Math.floor(next.worldY / PX_PER_M);

    // Check dagashi on the destination bolt
    const dagashi = this.obstacles.getDagashiAt(this.currentBoltIdx);
    if (dagashi) {
      dagashi.collected     = true;
      this.multiplier       = 2;
      this.multiplierTimer  = this.MULTIPLIER_DUR;
      this._notify('★ x2 GET! ★', '#ffff00', CANVAS_W / 2, CANVAS_H * 0.32);
    }

    // Score: base 5pt × multiplier × combo bonus
    this.combo++;
    const comboMult = this.combo >= 10 ? 2.0
                    : this.combo >= 5  ? 1.5
                    : this.combo >= 3  ? 1.2
                    :                    1.0;
    this.score += Math.floor(5 * this.multiplier * comboMult);

    // Combo milestone notifications
    if (this.combo === 5)  this._notify('COMBO x5!',  '#ff8800', CANVAS_W / 2, CANVAS_H * 0.42);
    if (this.combo === 10) this._notify('COMBO x10!', '#ff4400', CANVAS_W / 2, CANVAS_H * 0.42);
    if (this.combo > 0 && this.combo % 20 === 0)
      this._notify(`COMBO x${this.combo}!!`, '#ff0000', CANVAS_W / 2, CANVAS_H * 0.42);

    // Reset timer
    this.timeMax  = getTimeLimit(this.heightM);
    this.timeLeft = this.timeMax;
  }

  _notify(text, color, x, y) {
    this.notifications.push(new Notification(text, color, x, y));
  }

  // ---- Death ----
  _triggerDeath() {
    if (this.player.sliding) return;
    this.player.startSlide();
    this.combo       = 0;
    this.deathTimer  = 1800;

    if (this.heightM > this.highScore) {
      this.highScore   = this.heightM;
      this.isNewRecord = true;
      localStorage.setItem('tpj_high', this.highScore);
    }
  }

  // ---- Update ----
  _update(dt) {
    if (this.state !== 'playing') return;

    // Detect jump landing to spawn a crow
    const wasJumping = this.player.jumping;
    this.player.update(dt);
    const justLanded = wasJumping && !this.player.jumping && !this.player.sliding;

    if (justLanded) {
      const cur = this.bolts[this.currentBoltIdx];
      if (cur) {
        this.obstacles.trySpawnCrow(cur.worldY, this.heightM, this.currentBoltIdx);
      }
    }

    // Obstacles
    this.obstacles.update(dt);

    // Crow warning: check if NEXT bolt currently has a crow on its side
    const next = this.bolts[this.currentBoltIdx + 1];
    const cur  = this.bolts[this.currentBoltIdx];
    if (next && cur && !this.player.jumping && !this.player.sliding) {
      this.crowWarning = this.obstacles.crowOnSide(next.side, cur.worldY);
    } else {
      this.crowWarning = false;
    }

    // Multiplier countdown
    if (this.multiplierTimer > 0) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) {
        this.multiplierTimer = 0;
        this.multiplier      = 1;
      }
    }

    // Notifications
    for (const n of this.notifications) n.update(dt);
    this.notifications = this.notifications.filter(n => n.alive);

    // Timer (only while idle on bolt)
    if (!this.player.jumping && !this.player.sliding) {
      this.timeLeft -= dt / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._triggerDeath();
      }
    }

    // Camera smoothly tracks current bolt
    if (cur) {
      this.cameraTarget = cur.worldY - (CANVAS_H - CANVAS_H * 0.65);
    }
    this.cameraBottom += (this.cameraTarget - this.cameraBottom) * 0.1;

    // Death timer
    if (this.player.sliding) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this.state = 'gameover';
    }
  }

  // ---- Draw ----
  _draw() {
    if (this.state === 'title') {
      this.ui.drawTitle(this.highScore, this.animTick);
      return;
    }

    this._drawBackground();
    this._drawPole();
    this._drawBolts();
    this.obstacles.drawDagashi(this.ctx, (y) => this.worldToScreenY(y));
    this.obstacles.drawCrows(this.ctx,   (y) => this.worldToScreenY(y));
    this._drawPlayer();

    if (this.state === 'playing' || this.state === 'paused') {
      this.ui.drawHUD(
        this.heightM, this.score, this.highScore,
        this.timeLeft, this.timeMax, this.combo,
        this.multiplierTimer, this.MULTIPLIER_DUR,
        this.crowWarning
      );
      for (const n of this.notifications) n.draw(this.ctx);
    }
    if (this.state === 'paused') {
      this.ui.drawPause();
    }
    if (this.state === 'gameover') {
      this.ui.drawGameOver(this.heightM, this.score, this.highScore, this.isNewRecord);
    }
  }

  // ---- Background ----
  _drawBackground() {
    const ctx = this.ctx;
    const W = CANVAS_W, H = CANVAS_H;
    const hm = this.heightM;

    let c0, c1;
    if      (hm < 50)  { c0 = '#ff7722'; c1 = '#ffcc88'; }
    else if (hm < 100) { c0 = '#334466'; c1 = '#8899bb'; }
    else if (hm < 200) { c0 = '#aaccff'; c1 = '#ffffff'; }
    else               { c0 = '#000011'; c1 = '#111144'; }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if      (hm < 50)  this._drawStreetBg();
    else if (hm < 100) this._drawRooftopBg();
    else if (hm < 200) this._drawCloudBg();
    else               this._drawSpaceBg();
  }

  _drawStreetBg() {
    const ctx = this.ctx;
    const H = CANVAS_H;
    ctx.fillStyle = '#5a3311';
    ctx.fillRect(0, H * 0.45, 65, H * 0.55);
    ctx.fillRect(CANVAS_W - 72, H * 0.5, 72, H * 0.5);
    ctx.fillStyle = '#ffee88';
    for (let wy = H * 0.5; wy < H - 10; wy += 16) {
      for (let wx = 6;           wx < 58;             wx += 16) ctx.fillRect(wx, wy, 7, 9);
      for (let wx = CANVAS_W - 66; wx < CANVAS_W - 6; wx += 16) ctx.fillRect(wx, wy, 7, 9);
    }
  }

  _drawRooftopBg() {
    const ctx = this.ctx;
    const H = CANVAS_H;
    ctx.fillStyle = '#223355';
    ctx.fillRect(0, H * 0.6, 75, H * 0.4);
    ctx.fillRect(CANVAS_W - 68, H * 0.65, 68, H * 0.35);
    ctx.strokeStyle = '#557';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, H * 0.6); ctx.lineTo(30, H * 0.6 - 22);
    ctx.moveTo(18, H * 0.6 - 18); ctx.lineTo(42, H * 0.6 - 18);
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
    ctx.arc(x,           y,           r * 0.50, 0, Math.PI * 2);
    ctx.arc(x + r * 0.4, y - r * 0.1, r * 0.35, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y,           r * 0.40, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSpaceBg() {
    const ctx = this.ctx;
    const W = CANVAS_W, H = CANVAS_H;
    ctx.fillStyle = '#fff';
    [[20,40],[60,80],[100,20],[140,90],[200,35],[280,60],[320,110],
     [30,200],[310,300],[50,400],[330,500],[80,550],[250,150],[170,480]]
      .forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));
    const eg = ctx.createRadialGradient(W-30, H-30, 5, W-30, H-30, 40);
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
    ctx.fillStyle = '#3a2718';
    for (let y = 0; y < H; y += 22) ctx.fillRect(cx - POLE_WIDTH / 2 + 2, y, 2, 11);
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

      // Horizontal arm
      ctx.fillStyle = '#777';
      if (bolt.side === 'left') {
        ctx.fillRect(cx - POLE_WIDTH / 2 - BOLT_WIDTH, sy - 5, BOLT_WIDTH, 4);
      } else {
        ctx.fillRect(cx + POLE_WIDTH / 2, sy - 5, BOLT_WIDTH, 4);
      }

      // Platform colour: current=gold, next=cyan (red-flash if crow warning), others=grey
      let boltColor = '#999';
      if (isCurrent) {
        boltColor = '#ffdd44';
      } else if (isNext) {
        // Flash between cyan and red when crow warning is active
        boltColor = (this.crowWarning && Math.floor(this.animTick / 8) % 2 === 0)
          ? '#ff4422' : '#88ccff';
      }
      ctx.fillStyle = boltColor;
      ctx.fillRect(bolt.worldX - BOLT_WIDTH / 2, sy - BOLT_HEIGHT, BOLT_WIDTH, BOLT_HEIGHT);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(bolt.worldX - BOLT_WIDTH / 2 + 2, sy, BOLT_WIDTH - 2, 3);

      // Arrow indicator for next bolt
      if (isNext) {
        const arrowX = bolt.side === 'left'
          ? cx - POLE_WIDTH / 2 - BOLT_WIDTH - 14
          : cx + POLE_WIDTH / 2 + BOLT_WIDTH + 14;
        ctx.save();
        ctx.fillStyle = this.crowWarning ? '#ff4422' : '#ffff44';
        ctx.font      = 'bold 13px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(bolt.side === 'left' ? '◀' : '▶', arrowX, sy - 1);
        ctx.restore();
      }
    }
  }

  _drawPlayer() {
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
