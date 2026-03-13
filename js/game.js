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

    // State: 'title'|'stageselect'|'playing'|'paused'|'gameover'|'stagecomplete'|'charselect'|'ranking'|'nickname'
    this.state     = ranking.hasNickname() ? 'title' : 'nickname';

    // Stage mode
    this.gameMode       = 'endless';  // 'endless' | 'stage'
    this.currentStage   = 1;
    this.stageBoltsGoal = 0;
    this.stageCleared   = false;

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
    AdMobManager.init();
    GameCenterManager.init();
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

    // Hidden input for mobile virtual keyboard
    this.nickInput = document.getElementById('nick-input');
    this.nickInput.addEventListener('input', () => {
      if (this.state === 'nickname') {
        this.nickBuffer = this.nickInput.value.slice(0, 12);
      }
    });
    this.nickInput.addEventListener('keydown', (e) => {
      if (this.state === 'nickname' && e.key === 'Enter') {
        e.preventDefault();
        this._confirmNickname();
      }
    });
    if (this.state === 'nickname') this._focusNickInput();

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
          && !this.player.sliding) {
        const t  = e.changedTouches[0];
        const dx = t.clientX - this.swipeStartX;
        if (Math.abs(dx) > 22) {
          // Horizontal swipe → direction + jump (or wrong-direction check)
          const side = dx < 0 ? 'left' : 'right';
          if (!this.player.jumping) {
            this.selectedSide = side;
            this._doJump();
          } else {
            this._checkWrongDirection(side);
          }
        } else {
          // Tap → use tap-position for direction + jump (or wrong-direction check)
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
      if (hit(this.ui.nickOkRect)) { this._confirmNickname(); return; }
      this._focusNickInput();
      return;
    }

    if (this.state === 'title') {
      if (hit(this.ui.soundBtnRect)) { sound.toggle(); sound.menuSelect(); return; }
      if (hit(this.ui.charBtnRect))  { sound.menuSelect(); this._openCharSelect(); return; }
      if (hit(this.ui.rankBtnRect))  { sound.menuSelect(); this._openRanking(); return; }
      if (hit(this.ui.stageBtnRect)) { sound.menuSelect(); this.state = 'stageselect'; return; }
      this._startEndless(); return;
    }

    if (this.state === 'stageselect') {
      if (hit(this.ui.backBtnRect))    { sound.menuSelect(); this.state = 'title'; return; }
      if (hit(this.ui.endlessBtnRect)) { sound.menuSelect(); this._startEndless(); return; }
      const sRects = this.ui._stageSelectRects || [];
      for (const r of sRects) {
        if (r && hit(r) && r.available) {
          sound.menuSelect();
          this.currentStage = r.stage;
          this._startStageGame(r.stage);
          return;
        }
      }
      return;
    }

    if (this.state === 'stagecomplete') {
      if (this.ui.nextStageBtnRect && hit(this.ui.nextStageBtnRect)) {
        sound.menuSelect();
        const next = Math.min(this.currentStage + 1, 100);
        this._startStageGame(next);
        return;
      }
      if (hit(this.ui.titleBtnRect)) { sound.menuSelect(); this.state = 'title'; return; }
      return;
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
      if (hit(this.ui.retryBtnRect)) {
        sound.menuSelect();
        if (this.gameMode === 'stage') this._startStageGame(this.currentStage);
        else this._startEndless();
        return;
      }
      if (hit(this.ui.titleBtnRect))   { sound.menuSelect(); this.state = 'title'; return; }
      if (hit(this.ui.rankingBtnRect)) { sound.menuSelect(); this._openRanking(); return; }
      if (this.gameMode === 'stage') this._startStageGame(this.currentStage);
      else this._startEndless();
      return;
    }

    if (this.state === 'paused') { this.state = 'playing'; return; }

    if (this.state === 'playing') {
      if (hit(this.ui.soundHudRect)) { sound.toggle(); return; }
      if (!this.player.sliding) {
        const side = cx < CANVAS_W / 2 ? 'left' : 'right';
        if (!this.player.jumping) {
          // Left half → left, right half → right
          this.selectedSide = side;
          this._doJump();
        } else {
          this._checkWrongDirection(side);
        }
      }
    }
  }

  _onKey(e) {
    if (this.state === 'nickname') {
      this._handleNicknameKey(e); return;
    }
    if (this.state === 'title') {
      if (e.code === 'Enter') this._startEndless();
      return;
    }
    if (this.state === 'stageselect') {
      if (e.code === 'Escape') this.state = 'title';
      return;
    }
    if (this.state === 'stagecomplete') {
      if (e.code === 'Enter') {
        const next = Math.min(this.currentStage + 1, 100);
        this._startStageGame(next);
      }
      if (e.code === 'Escape') this.state = 'title';
      return;
    }
    if (this.state === 'charselect' || this.state === 'ranking') {
      if (e.code === 'Escape') this.state = 'title';
      return;
    }
    if (this.state === 'gameover') {
      if (e.code === 'Enter') {
        if (this.gameMode === 'stage') this._startStageGame(this.currentStage);
        else this._startEndless();
      }
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.state = this.state === 'playing' ? 'paused' : 'playing';
      return;
    }
    if (this.state !== 'playing') return;

    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (!this.player.jumping && !this.player.sliding) {
        this.selectedSide = 'left';
        this._doJump();
      } else if (this.player.jumping) {
        this._checkWrongDirection('left');
      }
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (!this.player.jumping && !this.player.sliding) {
        this.selectedSide = 'right';
        this._doJump();
      } else if (this.player.jumping) {
        this._checkWrongDirection('right');
      }
    }
  }

  // ---- Nickname ----
  _focusNickInput() {
    if (!this.nickInput) return;
    this.nickInput.value = this.nickBuffer;
    this.nickInput.focus();
  }

  _handleNicknameKey(e) {
    if (e.code === 'Enter') { this._confirmNickname(); return; }
    if (e.code === 'Backspace') {
      this.nickBuffer = this.nickBuffer.slice(0, -1);
      if (this.nickInput) this.nickInput.value = this.nickBuffer;
      return;
    }
    if (e.key.length === 1 && this.nickBuffer.length < 12) {
      this.nickBuffer += e.key;
      if (this.nickInput) this.nickInput.value = this.nickBuffer;
    }
  }

  _confirmNickname() {
    if (!this.nickBuffer.trim()) this.nickBuffer = 'ゲスト';
    ranking.setNickname(this.nickBuffer);
    if (this.nickInput) this.nickInput.blur();
    this.state = 'title';
  }

  // ---- Screens ----
  _openCharSelect() {
    this.state        = 'charselect';
    this.charScrollY  = 0;
    this.charScrollVY = 0;
  }

  _openRanking() {
    // Try Game Center native leaderboard first; fall back to in-game ranking
    GameCenterManager.showLeaderboard().then(shown => {
      if (shown) return;
      this.state        = 'ranking';
      this.rankEntries  = [];
      this.rankLoading  = true;
      ranking.fetchTop10((entries) => {
        this.rankEntries = entries;
        this.rankLoading = false;
      });
    });
  }

  // ---- Game Lifecycle ----
  _resetGameState() {
    this.state           = 'playing';
    this.bolts           = [];
    this.currentBoltIdx  = 0;
    this.heightM         = 0;
    this.score           = 0;
    this.combo           = 0;
    this.multiplier      = 1;
    this.multiplierTimer = 0;
    this.isNewRecord     = false;
    this.deathTimer      = 0;
    this.notifications   = [];
    this.unlockToast     = null;
    this.stageCleared    = false;

    this.obstacles.reset();
    this._generateBolts(BOLT_POOL);

    const startBolt      = this.bolts[0];
    this.selectedSide    = startBolt.side;

    const targetScreenY  = CANVAS_H * 0.65;
    this.cameraBottom    = startBolt.worldY - (CANVAS_H - targetScreenY);
    this.cameraTarget    = this.cameraBottom;

    this.player.reset();
    this.player.worldX      = startBolt.worldX;
    this.player.worldY      = startBolt.worldY;
    this.player.facingRight = startBolt.side === 'right';
  }

  _startEndless() {
    this.gameMode = 'endless';
    this._resetGameState();
    this.timeMax  = TIME_MAX;
    this.timeLeft = TIME_MAX;
    sound.startBGM();
  }

  _startStageGame(n) {
    this.gameMode       = 'stage';
    this.currentStage   = n;
    const cfg           = stageManager.getStageConfig(n);
    this.stageBoltsGoal = cfg.boltGoal;
    stageManager.setSelectedStage(n);
    this._resetGameState();
    this.timeMax  = cfg.timeMax;
    this.timeLeft = cfg.timeMax;
    sound.startBGM();
  }

  _triggerStageComplete() {
    sound.stopBGM();
    charManager.addCumulative(this.heightM);
    const result = stageManager.completeStage(this.currentStage);
    if (result.newCharUnlocked !== null) {
      const ch = CHARACTERS[result.newCharUnlocked];
      this.unlockToast = ch ? ch.name : null;
    }
    setTimeout(() => { this.state = 'stagecomplete'; }, 1000);
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
  _checkWrongDirection(side) {
    const next = this.bolts[this.currentBoltIdx + 1];
    if (!next) return;
    if (side !== next.side) {
      const hint = next.side === 'left' ? '◀ 左！' : '▶ 右！';
      this._notify(hint, '#ffee44', CANVAS_W/2, CANVAS_H*0.45);
      sound.crowPenalty();
      this.combo = 0;
    }
  }

  _doJump() {
    const cur  = this.bolts[this.currentBoltIdx];
    const next = this.bolts[this.currentBoltIdx + 1];
    if (!cur || !next) return;

    // Block jump if wrong direction selected; breaks combo
    if (this.selectedSide !== next.side) {
      this._checkWrongDirection(this.selectedSide);
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

    this.timeMax  = this.gameMode === 'stage'
      ? stageManager.getStageConfig(this.currentStage).timeMax
      : TIME_MAX;
    this.timeLeft = this.timeMax;

    // Stage clear check
    if (this.gameMode === 'stage' && !this.stageCleared) {
      if (this.currentBoltIdx >= this.stageBoltsGoal) {
        this.stageCleared = true;
        this._triggerStageComplete();
      }
    }
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

    if (this.gameMode === 'endless') {
      if (this.heightM > this.highScore) {
        this.highScore   = this.heightM;
        this.isNewRecord = true;
        localStorage.setItem('tpj_high', this.highScore);
        setTimeout(() => sound.newRecord(), 700);
      }
      const prevCumulative = charManager.cumulative;
      charManager.addCumulative(this.heightM);
      this._checkUnlocks(prevCumulative);
      ranking.submitScore(this.heightM, this.score, charManager.selected);
      GameCenterManager.submitScore(this.heightM);
    } else {
      // Stage mode: still earn cumulative height but no ranking
      charManager.addCumulative(this.heightM);
    }
  }

  _checkUnlocks(prevCumulative) {
    CHARACTERS.forEach((ch, i) => {
      if (i === 0 || ch.cost === Infinity) return;
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

    // Camera
    if (cur) {
      this.cameraTarget = cur.worldY - (CANVAS_H - CANVAS_H * 0.65);
    }
    this.cameraBottom += (this.cameraTarget - this.cameraBottom) * 0.10;

    // Stage cleared: freeze timer and death, just animate camera
    if (this.stageCleared) return;

    // Timer: drain rate increases with altitude
    if (!this.player.jumping && !this.player.sliding) {
      this.timeLeft -= (dt / 1000) * getTimeDrainRate(this.heightM);
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._triggerDeath();
      }
    }

    // Death transition
    if (this.player.sliding) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.state = 'gameover';
        AdMobManager.showOnGameOver(this.heightM);
      }
    }
  }

  // ---- Draw ----
  _draw() {
    const ctx = this.ctx;

    if (this.state === 'title') {
      this.ui.drawTitle(this.highScore, this.animTick, sound.enabled);
      return;
    }
    if (this.state === 'stageselect') {
      this.ui.drawStageSelect(stageManager.getProgress(), this.currentStage, this.animTick);
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
      ctx.fillStyle = '#1a0a3a'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this.ui.drawNicknameInput(this.nickBuffer, this.animTick);
      return;
    }

    // ---- In-game states ----
    this._drawBackground();
    this.obstacles.drawEntities(ctx, (y) => this.worldToScreenY(y));
    this._drawPole();
    this._drawBolts();
    this._drawGoalLine();
    this.obstacles.drawDagashi(ctx, (y) => this.worldToScreenY(y));
    this._drawPlayer();

    if (this.state === 'stagecomplete') {
      this.ui.drawStageComplete(this.currentStage, this.score, this.animTick, this.unlockToast);
      return;
    }

    if (this.state === 'playing' || this.state === 'paused') {
      const stageInfo = this.gameMode === 'stage' ? {
        stageNum: this.currentStage,
        boltIdx:  this.currentBoltIdx,
        boltGoal: this.stageBoltsGoal,
      } : null;
      this.ui.drawHUD(
        this.heightM, this.score, this.highScore,
        this.timeLeft, this.timeMax, this.combo,
        this.multiplierTimer, this.MULTIPLIER_DUR,
        this.animTick, sound.enabled, stageInfo
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
    const theme = this.gameMode === 'stage'
      ? stageManager.getThemeForStage(this.currentStage)
      : this._getEndlessTheme(this.heightM);
    this._drawTheme(theme);
  }

  _getEndlessTheme(hm) {
    if (hm < 50)  return 'countryside';
    if (hm < 100) return 'city';
    if (hm < 200) return 'clouds';
    return 'space';
  }

  _drawTheme(theme) {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    const gradients = {
      countryside: ['#ff9944','#ffddaa'],
      city:        ['#334466','#8899bb'],
      jungle:      ['#0a3a0a','#2a6a1a'],
      underwater:  ['#001a3a','#003a6a'],
      egypt:       ['#cc8822','#f0c060'],
      winter:      ['#99bbdd','#ddeeff'],
      volcano:     ['#220000','#661100'],
      space:       ['#000011','#111144'],
      demonworld:  ['#1a0000','#3a0a0a'],
      heaven:      ['#ddeeff','#ffffff'],
      clouds:      ['#aaccff','#ffffff'],
    };
    const [c0, c1] = gradients[theme] || gradients.space;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c0); grad.addColorStop(1, c1);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    const fns = {
      countryside: () => this._drawStreetBg(),
      city:        () => this._drawRooftopBg(),
      jungle:      () => this._drawJungleBg(),
      underwater:  () => this._drawUnderwaterBg(),
      egypt:       () => this._drawEgyptBg(),
      winter:      () => this._drawWinterBg(),
      volcano:     () => this._drawVolcanoBg(),
      space:       () => this._drawSpaceBg(),
      demonworld:  () => this._drawDemonworldBg(),
      heaven:      () => this._drawHeavenBg(),
      clouds:      () => this._drawCloudBg(),
    };
    if (fns[theme]) fns[theme]();
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
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    ctx.fillStyle = '#223355';
    ctx.fillRect(0, H*0.6, 75, H*0.4);
    ctx.fillRect(W-68, H*0.65, 68, H*0.35);
    // Stepped building silhouettes
    ctx.fillRect(0, H*0.45, 50, H*0.6);
    ctx.fillRect(W-55, H*0.5, 55, H*0.55);
    ctx.fillStyle = '#ffee88'; // windows
    for (let wy = H*0.48; wy < H-8; wy += 18) {
      for (let wx = 6; wx < 44; wx += 14) ctx.fillRect(wx, wy, 8, 10);
      for (let wx = W-50; wx < W-6; wx += 14) ctx.fillRect(wx, wy, 8, 10);
    }
    // Antenna
    ctx.strokeStyle='#557'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(30,H*0.45); ctx.lineTo(30,H*0.45-26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18,H*0.45-20); ctx.lineTo(42,H*0.45-20); ctx.stroke();
  }

  _drawCloudBg() {
    const ctx = this.ctx; const H = CANVAS_H;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    this._cloud(35, H*0.3, 55);
    this._cloud(CANVAS_W-65, H*0.5, 48);
    this._cloud(18, H*0.72, 38);
    this._cloud(CANVAS_W-40, H*0.2, 32);
  }

  _cloud(x, y, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r*0.5, 0, Math.PI*2);
    ctx.arc(x+r*0.4, y-r*0.1, r*0.35, 0, Math.PI*2);
    ctx.arc(x+r*0.7, y, r*0.4, 0, Math.PI*2);
    ctx.fill();
  }

  _drawJungleBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    // Leaf masses on sides
    ctx.fillStyle = '#0a4a0a';
    ctx.fillRect(0, 0, 55, H);
    ctx.fillRect(W-60, 0, 60, H);
    ctx.fillStyle = '#1a6a1a';
    ctx.fillRect(0, 0, 35, H); ctx.fillRect(W-40, 0, 40, H);
    // Vine lines
    ctx.strokeStyle = '#1a5a0a'; ctx.lineWidth = 2;
    [15, 30, W-20, W-38].forEach(x => {
      ctx.beginPath(); ctx.moveTo(x, 0);
      for (let y = 0; y < H; y += 40) {
        ctx.lineTo(x + Math.sin(y*0.08)*6, y);
      }
      ctx.stroke();
    });
    // Mist at base
    const mist = ctx.createLinearGradient(0, H*0.75, 0, H);
    mist.addColorStop(0, 'rgba(100,200,100,0)');
    mist.addColorStop(1, 'rgba(100,200,100,0.22)');
    ctx.fillStyle = mist; ctx.fillRect(0, H*0.75, W, H*0.25);
  }

  _drawUnderwaterBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    // Bubble dots
    ctx.fillStyle = 'rgba(150,220,255,0.5)';
    [[25,100],[40,250],[18,380],[W-30,150],[W-20,320],[W-45,480],
     [60,560],[W-60,600],[80,200],[W-80,400]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+8, y-20, 2, 0, Math.PI*2); ctx.fill();
    });
    // Kelp strands
    ctx.strokeStyle = '#005533'; ctx.lineWidth = 3;
    [20, 35, W-25, W-45].forEach(x => {
      ctx.beginPath(); ctx.moveTo(x, H);
      for (let y = H; y > 0; y -= 30) ctx.lineTo(x + Math.sin((H-y)*0.1)*10, y);
      ctx.stroke();
    });
    // Coral at base
    ctx.fillStyle = '#cc4422';
    ctx.fillRect(5, H-30, 20, 30); ctx.fillRect(30, H-20, 15, 20);
    ctx.fillStyle = '#ff6644';
    ctx.fillRect(8, H-40, 8, 40); ctx.fillRect(22, H-28, 6, 28);
    ctx.fillStyle = '#dd6633'; ctx.fillRect(W-35, H-25, 20, 25); ctx.fillRect(W-18, H-18, 12, 18);
  }

  _drawEgyptBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    // Sand ground
    ctx.fillStyle = '#bb7711';
    ctx.fillRect(0, H*0.75, W, H*0.25);
    // Pyramid silhouettes
    ctx.fillStyle = '#cc8822';
    ctx.beginPath(); ctx.moveTo(0, H*0.75); ctx.lineTo(55, H*0.3); ctx.lineTo(110, H*0.75); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W, H*0.75); ctx.lineTo(W-55, H*0.35); ctx.lineTo(W-110, H*0.75); ctx.fill();
    ctx.fillStyle = '#bb7711';
    ctx.beginPath(); ctx.moveTo(0, H*0.75); ctx.lineTo(35, H*0.45); ctx.lineTo(70, H*0.75); ctx.fill();
    // Hieroglyph columns
    ctx.fillStyle = '#aa6600';
    ctx.fillRect(5, H*0.4, 8, H*0.35);
    ctx.fillRect(W-13, H*0.45, 8, H*0.3);
    ctx.fillStyle = '#dd9922';
    for (let y = H*0.43; y < H*0.72; y += 18) {
      ctx.fillRect(6, y, 6, 4);
      ctx.fillRect(W-12, y, 6, 4);
    }
    // Blazing sun
    const sunG = ctx.createRadialGradient(W/2, -20, 5, W/2, -20, 70);
    sunG.addColorStop(0, '#ffee44'); sunG.addColorStop(0.6, '#ff8800'); sunG.addColorStop(1, 'transparent');
    ctx.fillStyle = sunG; ctx.fillRect(W/2-70, -70, 140, 90);
  }

  _drawWinterBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    // Snow ground
    ctx.fillStyle = '#eeeeff';
    ctx.fillRect(0, H*0.78, W, H*0.22);
    // Pine tree silhouettes
    const tree = (x, yBase, h) => {
      ctx.fillStyle = '#224422';
      for (let i = 0; i < 3; i++) {
        const ty = yBase - h + i*h/3;
        const tw = 20 + i*16;
        ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x-tw/2, ty+h/3+4); ctx.lineTo(x+tw/2, ty+h/3+4); ctx.fill();
      }
      ctx.fillStyle = '#443322'; ctx.fillRect(x-4, yBase, 8, 14);
    };
    tree(22, H*0.78, 70); tree(W-24, H*0.78, 60);
    // Snowflakes
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[15,80],[45,160],[W-20,100],[W-50,220],[30,320],[W-30,400],[50,500],[W-40,560],[20,450],[W-25,300]]
      .forEach(([x,y]) => { ctx.fillRect(x,y,3,3); ctx.fillRect(x+1,y-2,1,7); ctx.fillRect(x-2,y+1,7,1); });
    // Snow on top
    ctx.fillStyle = 'rgba(220,230,255,0.4)';
    ctx.fillRect(0, 0, W, 18);
  }

  _drawVolcanoBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    // Lava glow at base
    const lava = ctx.createRadialGradient(W/2, H, 10, W/2, H, W*0.6);
    lava.addColorStop(0, 'rgba(255,80,0,0.5)');
    lava.addColorStop(0.5, 'rgba(180,30,0,0.25)');
    lava.addColorStop(1, 'transparent');
    ctx.fillStyle = lava; ctx.fillRect(0, H*0.5, W, H*0.5);
    // Rocky formations
    ctx.fillStyle = '#330000';
    ctx.fillRect(0, H*0.55, 60, H*0.45);
    ctx.fillRect(W-65, H*0.6, 65, H*0.4);
    ctx.fillStyle = '#440000';
    ctx.beginPath(); ctx.moveTo(0,H*0.55); ctx.lineTo(30,H*0.38); ctx.lineTo(60,H*0.55); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W,H*0.6); ctx.lineTo(W-32,H*0.42); ctx.lineTo(W-65,H*0.6); ctx.fill();
    // Ember particles
    ctx.fillStyle = '#ff6600';
    [[20,H*0.4],[W-25,H*0.35],[40,H*0.6],[W-40,H*0.5],[15,H*0.25],[W-18,H*0.28]]
      .forEach(([x,y]) => { ctx.fillRect(x,y,3,3); ctx.fillRect(x+5,y-10,2,2); ctx.fillRect(x-4,y-6,2,2); });
    ctx.fillStyle = '#ffaa00';
    [[30,H*0.3],[W-30,H*0.45],[50,H*0.5]].forEach(([x,y]) => ctx.fillRect(x,y,2,2));
  }

  _drawSpaceBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    ctx.fillStyle = '#fff';
    [[20,40],[60,80],[100,20],[140,90],[200,35],[280,60],[320,110],
     [30,200],[310,300],[50,400],[330,500],[80,550],[250,150],[170,480]]
      .forEach(([x,y]) => ctx.fillRect(x,y,2,2));
    // Planet
    const pg = ctx.createRadialGradient(W-30,H-40,5,W-30,H-40,38);
    pg.addColorStop(0,'#4488ff'); pg.addColorStop(0.6,'#2244aa'); pg.addColorStop(1,'transparent');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(W-30,H-40,38,0,Math.PI*2); ctx.fill();
    // Nebula
    const ng = ctx.createRadialGradient(40,100,10,40,100,80);
    ng.addColorStop(0,'rgba(100,50,150,0.18)'); ng.addColorStop(1,'transparent');
    ctx.fillStyle = ng; ctx.fillRect(0,20,120,180);
  }

  _drawDemonworldBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    // Brimstone glow at base
    const glw = ctx.createRadialGradient(W/2, H, 5, W/2, H, W*0.55);
    glw.addColorStop(0, 'rgba(180,0,0,0.45)');
    glw.addColorStop(0.7, 'rgba(80,0,0,0.15)');
    glw.addColorStop(1, 'transparent');
    ctx.fillStyle = glw; ctx.fillRect(0, H*0.5, W, H*0.5);
    // Demonic structures on sides
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(0, H*0.3, 50, H*0.7);
    ctx.fillRect(W-55, H*0.35, 55, H*0.65);
    ctx.fillStyle = '#2a0000';
    // Arch shapes
    ctx.fillRect(5, H*0.25, 40, 20);
    ctx.fillRect(W-45, H*0.3, 40, 20);
    // Demonic eyes (pairs of glowing dots)
    ctx.fillStyle = '#ff2200';
    [[12,H*0.5],[18,H*0.65],[8,H*0.8],[W-20,H*0.48],[W-14,H*0.63],[W-22,H*0.77]]
      .forEach(([x,y]) => { ctx.fillRect(x,y,3,2); ctx.fillRect(x+8,y,3,2); });
    // Smoke column lines
    ctx.strokeStyle = 'rgba(80,0,0,0.3)'; ctx.lineWidth = 4;
    [20, W-20].forEach(x => {
      ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x+5, H*0.6); ctx.lineTo(x-5, H*0.3); ctx.stroke();
    });
  }

  _drawHeavenBg() {
    const ctx = this.ctx; const W = CANVAS_W, H = CANVAS_H;
    // Golden rays from top
    ctx.strokeStyle = 'rgba(255,220,100,0.18)'; ctx.lineWidth = 12;
    for (let a = -0.4; a <= 0.4; a += 0.13) {
      ctx.beginPath(); ctx.moveTo(W/2, -20);
      ctx.lineTo(W/2 + Math.sin(a)*H*1.2, H); ctx.stroke();
    }
    // Puffy cloud platforms on sides
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    [[20,H*0.2,60],[10,H*0.5,50],[15,H*0.75,45],[W-80,H*0.3,58],[W-70,H*0.55,48],[W-75,H*0.78,42]]
      .forEach(([x,y,r]) => this._cloud(x,y,r));
    // Halo arcs
    ctx.strokeStyle = 'rgba(255,220,80,0.35)'; ctx.lineWidth = 6;
    [H*0.15, H*0.45, H*0.7].forEach(y => {
      ctx.beginPath(); ctx.arc(W/2, y, 40, Math.PI, Math.PI*2); ctx.stroke();
    });
    // Soft pink tint at base
    const base = ctx.createLinearGradient(0, H*0.8, 0, H);
    base.addColorStop(0, 'transparent');
    base.addColorStop(1, 'rgba(255,200,220,0.2)');
    ctx.fillStyle = base; ctx.fillRect(0, H*0.8, W, H*0.2);
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

  _drawGoalLine() {
    if (this.gameMode !== 'stage' || this.stageCleared) return;
    const goalWorldY = this.stageBoltsGoal * BOLT_SPACING;
    const sy = this.worldToScreenY(goalWorldY);
    if (sy < -10 || sy > CANVAS_H + 10) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#ff2200';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(CANVAS_W, sy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff2200';
    ctx.font = 'bold 12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('GOAL', CANVAS_W / 2, sy - 6);
    ctx.restore();
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
