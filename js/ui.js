'use strict';

class UI {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this.W      = canvas.width;
    this.H      = canvas.height;
  }

  resize() {
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  // ---- Title Screen ----
  drawTitle(highScore, animTick) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a0a3a');
    grad.addColorStop(1, '#ff6633');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#ffffaa';
    [[20,30],[60,15],[100,50],[130,20],[160,45],[40,70],[90,80],[150,65]]
      .forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));

    // Pole silhouette
    this._drawPoleSilhouette(W / 2, H * 0.1, H * 0.55);

    // Title box
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W * 0.05, H * 0.15, W * 0.9, 60);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.05, H * 0.15, W * 0.9, 60);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('TELEPHONE', W / 2, H * 0.15 + 22);
    ctx.font = 'bold 20px "Courier New"';
    ctx.fillStyle = '#ff4400';
    ctx.fillText('POLE JUMP', W / 2, H * 0.15 + 48);
    ctx.restore();

    // High score
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Courier New"';
    ctx.fillStyle = '#aaffaa';
    ctx.fillText(`BEST: ${highScore}m`, W / 2, H * 0.15 + 80);
    ctx.restore();

    // START button (blinking)
    const blink = Math.floor(animTick / 30) % 2 === 0;
    const btnX = W * 0.2, btnY = H * 0.72, btnW = W * 0.6, btnH = 36;
    if (blink) {
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.save();
      ctx.font = 'bold 16px "Courier New"';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText('▶  START', W / 2, btnY + 24);
      ctx.restore();
    } else {
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);
      ctx.save();
      ctx.font = 'bold 16px "Courier New"';
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.fillText('▶  START', W / 2, btnY + 24);
      ctx.restore();
    }

    // Controls hint
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '9px "Courier New"';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('← →キー / スワイプ で左右選択', W / 2, btnY + 56);
    ctx.fillText('スペース / タップ でジャンプ', W / 2, btnY + 70);
    ctx.restore();
  }

  _drawPoleSilhouette(cx, topY, height) {
    const ctx = this.ctx;
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - 4, topY, 8, height);
    ctx.fillRect(cx - 30, topY + 10, 60, 5);
    ctx.fillRect(cx - 20, topY + 25, 40, 4);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#555';
      ctx.fillRect(cx - 30 + i * 24, topY + 6, 6, 14);
    }
  }

  // ---- HUD ----
  // multiplierTimer: ms remaining for ×2 bonus (0 = inactive)
  // multiplierMax  : 5000 ms
  // crowWarning    : bool – flash warning when crow is on next bolt's side
  drawHUD(height, score, highScore, timeLeft, timeMax, combo,
          multiplierTimer, multiplierMax, crowWarning) {
    const ctx = this.ctx;
    const W   = this.W;

    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, 58);

    ctx.save();
    ctx.font = 'bold 12px "Courier New"';

    // Height (left)
    ctx.fillStyle   = '#ffffff';
    ctx.textAlign   = 'left';
    ctx.fillText(`${Math.floor(height)}m`, 8, 16);

    // Score (left, second line)
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`${score}pt`, 8, 32);

    // Best (centre)
    ctx.fillStyle   = '#aaffaa';
    ctx.textAlign   = 'center';
    ctx.fillText(`BEST ${highScore}m`, W / 2, 16);

    // Combo (centre, second line) - only show if > 1
    if (combo > 1) {
      const comboColor = combo >= 10 ? '#ff4400' : combo >= 5 ? '#ff8800' : '#ffcc44';
      ctx.fillStyle = comboColor;
      ctx.font      = 'bold 11px "Courier New"';
      ctx.fillText(`COMBO x${combo}`, W / 2, 32);
    }

    // Multiplier indicator (right)
    if (multiplierTimer > 0) {
      const ratio = multiplierTimer / multiplierMax;
      // Blinking when < 1 s remaining
      const show = multiplierTimer > 1000 || Math.floor(multiplierTimer / 150) % 2 === 0;
      if (show) {
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px "Courier New"';
        ctx.fillText('x2 ★', W - 8, 16);
        // Small timer bar
        const bw = 46, bh = 5, bx = W - 8 - bw, by = 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(bx, by, Math.round(bw * ratio), bh);
      }
    }

    ctx.restore();

    // Timer bar
    this._drawTimerBar(timeLeft, timeMax, crowWarning);
  }

  _drawTimerBar(timeLeft, timeMax, crowWarning) {
    const ctx   = this.ctx;
    const W     = this.W;
    const barW  = W - 16;
    const barH  = 9;
    const barX  = 8;
    const barY  = 46;
    const ratio = Math.max(0, timeLeft / timeMax);

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    let color;
    if      (ratio > 0.6) color = '#00cc44';
    else if (ratio > 0.3) color = '#ffcc00';
    else                  color = '#ff2200';

    // When crow warning is active, tint the bar orange
    if (crowWarning && ratio > 0.3) color = '#ff8800';

    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, Math.round(barW * ratio), barH);

    ctx.strokeStyle = '#666';
    ctx.lineWidth   = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  // ---- Game Over ----
  drawGameOver(height, score, highScore, isNewRecord) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    const panelX = W * 0.08, panelW = W * 0.84;
    const panelY = H * 0.22, panelH = H * 0.54;

    ctx.fillStyle   = '#1a0a00';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth   = 3;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = 'bold 20px "Courier New"';
    ctx.fillStyle = '#ff4400';
    ctx.fillText('GAME OVER', W / 2, panelY + 30);

    ctx.font = 'bold 12px "Courier New"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`高さ: ${Math.floor(height)}m`, W / 2, panelY + 60);

    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`スコア: ${score}pt`, W / 2, panelY + 80);

    if (isNewRecord) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 14px "Courier New"';
      ctx.fillText('★ NEW RECORD! ★', W / 2, panelY + 108);
    } else {
      ctx.fillStyle = '#aaffaa';
      ctx.font = '11px "Courier New"';
      ctx.fillText(`ベスト: ${highScore}m`, W / 2, panelY + 108);
    }

    // Retry button
    const btnY = panelY + panelH - 75;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(panelX + 10, btnY, panelW - 20, 28);
    ctx.font = 'bold 13px "Courier New"';
    ctx.fillStyle = '#000';
    ctx.fillText('▶  もういちど', W / 2, btnY + 19);

    // Title button
    const btn2Y = btnY + 36;
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth   = 2;
    ctx.strokeRect(panelX + 10, btn2Y, panelW - 20, 24);
    ctx.font = '11px "Courier New"';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('タイトルへ', W / 2, btn2Y + 16);

    ctx.restore();

    this.retryBtnRect = { x: panelX + 10, y: btnY,  w: panelW - 20, h: 28 };
    this.titleBtnRect = { x: panelX + 10, y: btn2Y, w: panelW - 20, h: 24 };
  }

  // ---- Pause ----
  drawPause() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Courier New"';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('PAUSE', W / 2, H / 2 - 10);
    ctx.font = '11px "Courier New"';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('P / Esc でつづける', W / 2, H / 2 + 16);
    ctx.restore();
  }
}
