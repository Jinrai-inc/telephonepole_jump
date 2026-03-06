'use strict';

// ---- Constants ----
const CANVAS_W = 360;
const CANVAS_H = 640;

const POLE_WIDTH   = 14;
const BOLT_WIDTH   = 28;
const BOLT_HEIGHT  = 8;
const BOLT_SPACING = 72;
const BOLT_POOL    = 30;
const PX_PER_M     = 36; // 72px / 2m per bolt

// Timer always resets to TIME_MAX after each jump.
// The drain rate (units/sec) increases with altitude.
const TIME_MAX = 2.0;

function getTimeDrainRate(heightM) {
  if (heightM < 50)  return 1.0;
  if (heightM < 100) return 1.5;
  if (heightM < 200) return 2.0;
  if (heightM < 350) return 2.8;
  return 3.5;
}

// ---- Bolt ----
class Bolt {
  constructor(index, side) {
    this.index  = index;
    this.side   = side;
    this.worldY = index * BOLT_SPACING;
    this.worldX = this._calcWorldX();
  }
  _calcWorldX() {
    const cx = CANVAS_W / 2;
    return this.side === 'left'
      ? cx - POLE_WIDTH/2 - BOLT_WIDTH/2
      : cx + POLE_WIDTH/2 + BOLT_WIDTH/2;
  }
}

// ---- Notification ----
class Notification {
  constructor(text, color, x, y) {
    this.text  = text;
    this.color = color;
    this.x = x; this.y = y;
    this.timer = 1200;
    this.max   = 1200;
  }
  update(dt) { this.timer -= dt; }
  get alive()  { return this.timer > 0; }
  draw(ctx) {
    const alpha = Math.min(1, this.timer / 350);
    const rise  = (this.max - this.timer) * 0.044;
    ctx.save();
    ctx.globalAlpha   = alpha;
    ctx.font          = 'bold 15px "Courier New"';
    ctx.strokeStyle   = 'rgba(0,0,0,0.8)';
    ctx.lineWidth     = 3;
    ctx.fillStyle     = this.color;
    ctx.textAlign     = 'center';
    ctx.strokeText(this.text, this.x, this.y - rise);
    ctx.fillText(this.text,   this.x, this.y - rise);
    ctx.restore();
  }
}

// ---- Game ----
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resizeCanvas();

    this.ui        = new UI(this.canvas, this.ctx);
    this.player    = new Player(this.canvas);
    this.obstacles = new ObstacleManager();

    // State: 'title'|'playing'|'paused'|'gameover'|'charselect'|'ranking'|'nickname'
    this.state     = ranking.hasNickname() ? 'title' : 'nickname';

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
    this.multiplierTimer = 0;
    this.MULTIPLIER_DUR  = 5000;

    // Timer
    this.timeLeft = 2.0;
    this.timeMax  = 2.0;

    // Death
    this.deathTimer  = 0;
    this.isNewRecord = false;

    // Notifications
    this.notifications = [];

    // Unlock toast
    this.unlockToast = null;

    // Input
    this.animTick    = 0;
    this.selectedSide = 'left';
    this.swipeStartX  = null;
    this.swipeStartY  = null;

    // Char select scroll
    this.charScrollY = 0;
    this.charScrollVY = 0;

    // Ranking
    this.rankEntries = [];
    this.rankLoading = false;

    // Nickname input buffer
    this.nickBuffer = ranking.nickname || '';

    this._bindInput();
    this.lastTime = null;
    requestAnimationFrame((t) => this._loop(t));
  }

  // ---- Canvas ----
  _resizeCanvas() {
    const scale = Math.min(window.innerWidth/CANVAS_W, window.innerHeight/CANVAS_H);
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    this.canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
  }

  // ---- Coord ----
  worldToScreenY(worldY) { return CANVAS_H - (worldY - this.cameraBottom); }

  // ---- Input ----
  _bindInput() {
    window.addEventListener('keydown', (e) => this._onKey(e));

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.swipeStartX = t.clientX;
      this.swipeStartY = t.clientY;
      // Menu screens: fire tap immediately for responsive buttons
      if (this.state !== 'playing') this._onTap(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.swipeStartX === null) return;
      const t  = e.touches[0];
      const dy = t.clientY - this.swipeStartY;
      if (this.state === 'charselect') {
        this.charScrollY = Math.max(0, this.charScrollY - dy * 1.5);
        this.swipeStartY = t.clientY;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this.swipeStartX !== null && this.state === 'playing'
          && !this.player.jumping && !this.player.sliding) {
        const t  = e.changedTouches[0];
        const dx = t.clientX - this.swipeStartX;
        if (Math.abs(dx) > 22) {
          // Horizontal swipe → direction + jump
          this.selectedSide = dx < 0 ? 'left' : 'right';
          this._doJump();
        } else {
          // Tap → use tap-position for direction + jump
          this._onTap(t.clientX, t.clientY);
        }
      }
      this.swipeStartX = this.swipeStartY = null;
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      const rect   = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top)  * scaleY;
      this._onCanvasClick(cx, cy, e.clientX, e.clientY);
    });

    window.addEventListener('resize', () => { this._resizeCanvas(); this.ui.resize(); });
  }

  _canvasCoords(clientX, clientY) {
    const rect   = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (CANVAS_W / rect.width),
      y: (clientY - rect.top)  * (CANVAS_H / rect.height),
    };
  }

  _onTap(clientX, clientY) {
    const { x: cx, y: cy } = this._canvasCoords(clientX, clientY);
    this._onCanvasClick(cx, cy, clientX, clientY);
  }

  _onCanvasClick(cx, cy, clientX, clientY) {
    const hit = (r) => r && cx >= r.x && cx <= r.x+r.w && cy >= r.y && cy <= r.y+r.h;

    if (this.state === 'nickname') {
      if (hit(this.ui.nickOkRect)) this._confirmNickname();
      return;
    }

    if (this.state === 'title') {
      if (hit(this.ui.soundBtnRect)) { sound.toggle(); sound.menuSelect(); return; }
      if (hit(this.ui.charBtnRect))  { sound.menuSelect(); this._openCharSelect(); return; }
      if (hit(this.ui.rankBtnRect))  { sound.menuSelect(); this._openRanking(); return; }
      this._startGame(); return;
    }

    if (this.state === 'charselect') {
      if (hit(this.ui.backBtnRect)) { sound.menuSelect(); this.state = 'title'; return; }
      const rects = this.ui._charSelectRects || [];
      for (const r of rects) {
        if (r && hit(r)) {
          if (r.unlocked) {
            charManager.selectCharacter(r.id);
            sound.menuSelect();
          }
          return;
        }
      }
      return;
    }

    if (this.state === 'ranking') {
      if (hit(this.ui.backBtnRect)) { sound.menuSelect(); this.state = 'title'; return; }
      return;
    }

    if (this.state === 'gameover') {
      if (hit(this.ui.retryBtnRect))   { sound.menuSelect(); this._startGame(); return; }
      if (hit(this.ui.titleBtnRect))   { sound.menuSelect(); this.state = 'title'; return; }
      if (hit(this.ui.rankingBtnRect)) { sound.menuSelect(); this._openRanking(); return; }
      this._startGame(); return;
    }

    if (this.state === 'paused') { this.state = 'playing'; return; }

    if (this.state === 'playing') {
      if (hit(this.ui.soundHudRect)) { sound.toggle(); return; }
      if (!this.player.jumping && !this.player.sliding) {
        // Left half → left, right half → right
        this.selectedSide = cx < CANVAS_W / 2 ? 'left' : 'right';
        this._doJump();
      }
    }
  }

  _onKey(e) {
    if (this.state === 'nickname') {
      this._handleNicknameKey(e); return;
    }
    if (this.state === 'title') {
      if (e.code === 'Enter') this._startGame();
      return;
    }
    if (this.state === 'charselect' || this.state === 'ranking') {
      if (e.code === 'Escape') this.state = 'title';
      return;
    }
    if (this.state === 'gameover') {
      if (e.code === 'Enter') this._startGame();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.state = this.state === 'playing' ? 'paused' : 'playing';
      return;
    }
    if (this.state !== 'playing') return;

    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      this.selectedSide = 'left';
      if (!this.player.jumping && !this.player.sliding) this._doJump();
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      this.selectedSide = 'right';
      if (!this.player.jumping && !this.player.sliding) this._doJump();
    }
  }

  // ---- Nickname ----
  _handleNicknameKey(e) {
    if (e.code === 'Enter') { this._confirmNickname(); return; }
    if (e.code === 'Backspace') {
      this.nickBuffer = this.nickBuffer.slice(0, -1); return;
    }
    if (e.key.length === 1 && this.nickBuffer.length < 12) {
      this.nickBuffer += e.key;
    }
  }

  _confirmNickname() {
    if (!this.nickBuffer.trim()) this.nickBuffer = 'ゲスト';
    ranking.setNickname(this.nickBuffer);
    this.state = 'title';
  }

  // ---- Screens ----
  _openCharSelect() {
    this.state        = 'charselect';
    this.charScrollY  = 0;
    this.charScrollVY = 0;
  }

  _openRanking() {
    this.state        = 'ranking';
    this.rankEntries  = [];
    this.rankLoading  = true;
    ranking.fetchTop10((entries) => {
      this.rankEntries = entries;
      this.rankLoading = false;
    });
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
    this.notifications  = [];
    this.unlockToast    = null;

    this.obstacles.reset();
    this._generateBolts(BOLT_POOL);

    const startBolt  = this.bolts[0];
    this.selectedSide = startBolt.side;

    const targetScreenY  = CANVAS_H * 0.65;
    this.cameraBottom    = startBolt.worldY - (CANVAS_H - targetScreenY);
    this.cameraTarget    = this.cameraBottom;

    this.player.reset();
    this.player.worldX      = startBolt.worldX;
    this.player.worldY      = startBolt.worldY;
    this.player.facingRight = startBolt.side === 'right';

    this.timeMax  = TIME_MAX;
    this.timeLeft = TIME_MAX;

    sound.startBGM();
  }

  // ---- Bolts ----
  _generateBolts(count) {
    let prevSide = Math.random() < 0.5 ? 'left' : 'right';
    for (let i = 0; i < count; i++) {
      const side = i === 0 ? prevSide
        : (Math.random() < 0.8 ? (prevSide==='left'?'right':'left') : prevSide);
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
        ? (last.side==='left'?'right':'left') : last.side;
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

    // Block jump if wrong direction selected; breaks combo
    if (this.selectedSide !== next.side) {
      const hint = next.side === 'left' ? '◀ 左！' : '▶ 右！';
      this._notify(hint, '#ffee44', CANVAS_W/2, CANVAS_H*0.45);
      sound.crowPenalty();
      this.combo = 0;
      return;
    }

    this.player.startJump(cur.worldX, cur.worldY, next.worldX, next.worldY);
    this.currentBoltIdx++;
    this._ensureBoltsAhead();

    this.heightM = Math.floor(next.worldY / PX_PER_M);

    // Dagashi
    const dag = this.obstacles.getDagashiAt(this.currentBoltIdx);
    if (dag) {
      dag.collected    = true;
      this.multiplier  = 2;
      this.multiplierTimer = this.MULTIPLIER_DUR;
      this._notify('★ x2 GET! ★', '#ffff00', CANVAS_W/2, CANVAS_H*0.32);
      sound.dagashiGet();
    }

    // Score
    this.combo++;
    const cm = this.combo >= 10 ? 2.0 : this.combo >= 5 ? 1.5 : this.combo >= 3 ? 1.2 : 1.0;
    this.score += Math.floor(5 * this.multiplier * cm);

    if (this.combo === 5)  { this._notify('COMBO x5!',  '#ff8800', CANVAS_W/2, CANVAS_H*0.42); sound.combo(1); }
    if (this.combo === 10) { this._notify('COMBO x10!', '#ff4400', CANVAS_W/2, CANVAS_H*0.42); sound.combo(2); }
    if (this.combo > 10 && this.combo % 20 === 0) {
      this._notify(`COMBO x${this.combo}!!`, '#ff0000', CANVAS_W/2, CANVAS_H*0.42);
      sound.combo(3);
    }

    this.timeMax  = TIME_MAX;
    this.timeLeft = TIME_MAX;
  }

  _notify(text, color, x, y) {
    this.notifications.push(new Notification(text, color, x, y));
  }

  // ---- Death ----
  _triggerDeath() {
    if (this.player.sliding) return;
    this.player.startSlide();
    this.combo      = 0;
    this.deathTimer = 1900;
    sound.stopBGM();
    sound.gameOver();

    if (this.heightM > this.highScore) {
      this.highScore   = this.heightM;
      this.isNewRecord = true;
      localStorage.setItem('tpj_high', this.highScore);
      setTimeout(() => sound.newRecord(), 700);
    }

    // Cumulative progress
    const prevCumulative = charManager.cumulative;
    charManager.addCumulative(this.heightM);
    this._checkUnlocks(prevCumulative);

    // Submit score
    ranking.submitScore(this.heightM, this.score, charManager.selected);
  }

  _checkUnlocks(prevCumulative) {
    CHARACTERS.forEach((ch, i) => {
      if (i === 0) return;
      // Detect threshold crossing: was locked before, is unlocked now
      if (prevCumulative < ch.cost && charManager.cumulative >= ch.cost) {
        this.unlockToast = ch.name;
        sound.unlock();
      }
    });
  }

  // ---- Update ----
  _update(dt) {
    this.animTick++;

    if (this.state === 'charselect') {
      // Momentum scrolling
      this.charScrollVY *= 0.88;
      this.charScrollY   = Math.max(0, this.charScrollY + this.charScrollVY);
      return;
    }

    if (this.state !== 'playing') return;

    const wasJumping = this.player.jumping;
    this.player.update(dt);
    const justLanded = wasJumping && !this.player.jumping && !this.player.sliding;

    if (justLanded) {
      const cur = this.bolts[this.currentBoltIdx];
      if (cur) this.obstacles.trySpawnEntity(cur.worldY, this.heightM, this.currentBoltIdx);
    }

    this.obstacles.update(dt);

    const next = this.bolts[this.currentBoltIdx + 1];
    const cur  = this.bolts[this.currentBoltIdx];

    // Multiplier countdown
    if (this.multiplierTimer > 0) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) { this.multiplierTimer = 0; this.multiplier = 1; }
    }

    // Notifications
    for (const n of this.notifications) n.update(dt);
    this.notifications = this.notifications.filter(n => n.alive);

    // Unlock toast
    if (this.unlockToast) {
      this._notify(`🎉 ${this.unlockToast} 解放！`, '#ffff00', CANVAS_W/2, CANVAS_H*0.5);
      this.unlockToast = null;
    }

    // Timer: drain rate increases with altitude
    if (!this.player.jumping && !this.player.sliding) {
      this.timeLeft -= (dt / 1000) * getTimeDrainRate(this.heightM);
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._triggerDeath();
      }
    }

    // Camera
    if (cur) {
      this.cameraTarget = cur.worldY - (CANVAS_H - CANVAS_H * 0.65);
    }
    this.cameraBottom += (this.cameraTarget - this.cameraBottom) * 0.10;

    // Death transition
    if (this.player.sliding) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this.state = 'gameover';
    }
  }

  // ---- Draw ----
  _draw() {
    const ctx = this.ctx;

    if (this.state === 'title') {
      this.ui.drawTitle(this.highScore, this.animTick, sound.enabled);
      return;
    }
    if (this.state === 'charselect') {
      this.ui.drawCharSelect(this.charScrollY, this.animTick);
      return;
    }
    if (this.state === 'ranking') {
      this.ui.drawRanking(this.rankEntries, this.highScore, this.rankLoading);
      return;
    }
    if (this.state === 'nickname') {
      // Draw simple background then nickname overlay
      ctx.fillStyle = '#1a0a3a'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this.ui.drawNicknameInput(this.nickBuffer, this.animTick);
      return;
    }

    // ---- In-game states ----
    this._drawBackground();
    this.obstacles.drawEntities(ctx, (y) => this.worldToScreenY(y));
    this._drawPole();
    this._drawBolts();
    this.obstacles.drawDagashi(ctx, (y) => this.worldToScreenY(y));
    this._drawPlayer();

    if (this.state === 'playing' || this.state === 'paused') {
      this.ui.drawHUD(
        this.heightM, this.score, this.highScore,
        this.timeLeft, this.timeMax, this.combo,
        this.multiplierTimer, this.MULTIPLIER_DUR,
        this.animTick, sound.enabled
      );
      for (const n of this.notifications) n.draw(ctx);
    }
    if (this.state === 'paused') this.ui.drawPause();
    if (this.state === 'gameover') {
      this.ui.drawGameOver(this.heightM, this.score, this.highScore,
                           this.isNewRecord, this.animTick);
    }
  }

  // ---- Background ----
  _drawBackground() {
    const ctx = this.ctx;
    const W = CANVAS_W, H = CANVAS_H;
    const hm = this.heightM;

    let c0, c1;
    if      (hm < 50)  { c0='#ff7722'; c1='#ffcc88'; }
    else if (hm < 100) { c0='#334466'; c1='#8899bb'; }
    else if (hm < 200) { c0='#aaccff'; c1='#ffffff'; }
    else               { c0='#000011'; c1='#111144'; }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c0); grad.addColorStop(1, c1);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    if      (hm < 50)  this._drawStreetBg();
    else if (hm < 100) this._drawRooftopBg();
    else if (hm < 200) this._drawCloudBg();
    else               this._drawSpaceBg();
  }

  _drawStreetBg() {
    const ctx = this.ctx; const H = CANVAS_H;
    ctx.fillStyle = '#5a3311';
    ctx.fillRect(0, H*0.45, 65, H*0.55);
    ctx.fillRect(CANVAS_W-72, H*0.5, 72, H*0.5);
    ctx.fillStyle = '#ffee88';
    for (let wy = H*0.5; wy < H-10; wy += 16) {
      for (let wx = 6; wx < 58; wx += 16) ctx.fillRect(wx, wy, 7, 9);
      for (let wx = CANVAS_W-66; wx < CANVAS_W-6; wx += 16) ctx.fillRect(wx, wy, 7, 9);
    }
  }

  _drawRooftopBg() {
    const ctx = this.ctx; const H = CANVAS_H;
    ctx.fillStyle = '#223355';
    ctx.fillRect(0, H*0.6, 75, H*0.4);
    ctx.fillRect(CANVAS_W-68, H*0.65, 68, H*0.35);
    ctx.strokeStyle='#557'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(30,H*0.6); ctx.lineTo(30,H*0.6-22);
    ctx.moveTo(18,H*0.6-18); ctx.lineTo(42,H*0.6-18);
    ctx.stroke();
  }

  _drawCloudBg() {
    const ctx = this.ctx; const H = CANVAS_H;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    this._cloud(35, H*0.3, 55);
    this._cloud(CANVAS_W-65, H*0.5, 48);
    this._cloud(18, H*0.72, 38);
  }

  _cloud(x, y, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r*0.5, 0, Math.PI*2);
    ctx.arc(x+r*0.4, y-r*0.1, r*0.35, 0, Math.PI*2);
    ctx.arc(x+r*0.7, y, r*0.4, 0, Math.PI*2);
    ctx.fill();
  }

  _drawSpaceBg() {
    const ctx = this.ctx; const W=CANVAS_W, H=CANVAS_H;
    ctx.fillStyle='#fff';
    [[20,40],[60,80],[100,20],[140,90],[200,35],[280,60],[320,110],
     [30,200],[310,300],[50,400],[330,500],[80,550],[250,150],[170,480]]
      .forEach(([x,y])=>ctx.fillRect(x,y,2,2));
    const eg = ctx.createRadialGradient(W-30,H-30,5,W-30,H-30,40);
    eg.addColorStop(0,'#4488ff'); eg.addColorStop(0.6,'#2244aa'); eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(W-30,H-30,40,0,Math.PI*2); ctx.fill();
  }

  _drawPole() {
    const ctx=this.ctx; const cx=CANVAS_W/2; const H=CANVAS_H;
    ctx.fillStyle='#4a3728'; ctx.fillRect(cx-POLE_WIDTH/2,0,POLE_WIDTH,H);
    ctx.fillStyle='#3a2718';
    for (let y=0;y<H;y+=22) ctx.fillRect(cx-POLE_WIDTH/2+2,y,2,11);
    ctx.fillStyle='#5a4738'; ctx.fillRect(cx-POLE_WIDTH/2,0,3,H);
  }

  _drawBolts() {
    const ctx=this.ctx; const cx=CANVAS_W/2;
    for (const bolt of this.bolts) {
      const sy = this.worldToScreenY(bolt.worldY);
      if (sy < -30 || sy > CANVAS_H+30) continue;
      const isCur  = bolt.index === this.currentBoltIdx;
      const isNext = bolt.index === this.currentBoltIdx + 1;

      // Arm
      ctx.fillStyle = '#777';
      if (bolt.side==='left') ctx.fillRect(cx-POLE_WIDTH/2-BOLT_WIDTH, sy-5, BOLT_WIDTH, 4);
      else                    ctx.fillRect(cx+POLE_WIDTH/2, sy-5, BOLT_WIDTH, 4);

      // Platform
      let pc = isCur ? '#ffdd44' : isNext ? '#88ccff' : '#999';
      ctx.fillStyle = pc;
      ctx.fillRect(bolt.worldX-BOLT_WIDTH/2, sy-BOLT_HEIGHT, BOLT_WIDTH, BOLT_HEIGHT);

      // Shadow
      ctx.fillStyle='rgba(0,0,0,0.22)';
      ctx.fillRect(bolt.worldX-BOLT_WIDTH/2+2, sy, BOLT_WIDTH-2, 3);

      // Arrow indicator
      if (isNext) {
        const ax = bolt.side==='left'
          ? cx-POLE_WIDTH/2-BOLT_WIDTH-14
          : cx+POLE_WIDTH/2+BOLT_WIDTH+14;
        ctx.save();
        ctx.fillStyle = '#ffff44';
        ctx.font='bold 13px "Courier New"'; ctx.textAlign='center';
        ctx.fillText(bolt.side==='left'?'◀':'▶', ax, sy-1);
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
    this._update(dt);
    this._draw();
    requestAnimationFrame((t) => this._loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => { new Game(); });
