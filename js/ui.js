'use strict';

class UI {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.W = canvas.width;
    this.H = canvas.height;
  }

  resize() {
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  // ---- Pixel font helper (chunky retro look via fillRect) ----
  drawPixelText(text, x, y, scale, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color || '#fff';
    // Use canvas built-in font as pixel font substitute
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.font = `bold ${8 * scale}px "Courier New", monospace`;
    ctx.fillStyle = color || '#fff';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // ---- Title Screen ----
  drawTitle(highScore, animTick) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // Sky gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a0a3a');
    grad.addColorStop(1, '#ff6633');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw pixel stars
    ctx.fillStyle = '#ffffaa';
    const stars = [[20,30],[60,15],[100,50],[130,20],[160,45],[40,70],[90,80],[150,65]];
    for (const [sx, sy] of stars) {
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Telephone pole silhouette
    this._drawPoleSilhouette(ctx, W / 2, H * 0.1, H * 0.55);

    // Title box
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W * 0.05, H * 0.15, W * 0.9, 60);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.05, H * 0.15, W * 0.9, 60);

    ctx.save();
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.fillText('TELEPHONE', W / 2, H * 0.15 + 22);
    ctx.font = 'bold 20px "Courier New"';
    ctx.fillStyle = '#ff4400';
    ctx.fillText('POLE JUMP', W / 2, H * 0.15 + 48);
    ctx.restore();

    // High score
    ctx.save();
    ctx.font = 'bold 11px "Courier New"';
    ctx.fillStyle = '#aaffaa';
    ctx.textAlign = 'center';
    ctx.fillText(`BEST: ${highScore}m`, W / 2, H * 0.15 + 80);
    ctx.restore();

    // START button (blinking)
    const blink = Math.floor(animTick / 30) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(W * 0.2, H * 0.72, W * 0.6, 36);
      ctx.save();
      ctx.font = 'bold 16px "Courier New"';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText('▶  START', W / 2, H * 0.72 + 24);
      ctx.restore();
    } else {
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.2, H * 0.72, W * 0.6, 36);
      ctx.save();
      ctx.font = 'bold 16px "Courier New"';
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.fillText('▶  START', W / 2, H * 0.72 + 24);
      ctx.restore();
    }

    // Operation hints
    ctx.save();
    ctx.font = '9px "Courier New"';
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'center';
    ctx.fillText('← →キー / スワイプ で左右選択', W / 2, H * 0.72 + 56);
    ctx.fillText('スペース / タップ でジャンプ', W / 2, H * 0.72 + 70);
    ctx.restore();
  }

  _drawPoleSilhouette(ctx, cx, topY, height) {
    // Main pole
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - 4, topY, 8, height);

    // Cross arms at top
    ctx.fillRect(cx - 30, topY + 10, 60, 5);
    ctx.fillRect(cx - 20, topY + 25, 40, 4);

    // Insulators
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#555';
      ctx.fillRect(cx - 30 + i * 24, topY + 6, 6, 14);
    }
  }

  // ---- HUD during gameplay ----
  drawHUD(height, score, highScore, timeLeft, timeMax, combo) {
    const ctx = this.ctx;
    const W = this.W;

    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, 44);

    // Height
    ctx.save();
    ctx.font = 'bold 12px "Courier New"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(height)}m`, 8, 16);

    // Score
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`${score}pt`, 8, 32);

    // High score
    ctx.fillStyle = '#aaffaa';
    ctx.textAlign = 'center';
    ctx.fillText(`BEST ${highScore}m`, W / 2, 16);

    // Combo
    if (combo > 1) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 11px "Courier New"';
      ctx.fillText(`COMBO x${combo}`, W / 2, 32);
    }
    ctx.restore();

    // Timer bar (right side)
    this._drawTimerBar(timeLeft, timeMax);
  }

  _drawTimerBar(timeLeft, timeMax) {
    const ctx = this.ctx;
    const W = this.W;
    const barW = W - 16;
    const barH = 8;
    const barX = 8;
    const barY = 48;
    const ratio = Math.max(0, timeLeft / timeMax);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    // Fill color: green -> yellow -> red
    let color;
    if (ratio > 0.6) color = '#00cc44';
    else if (ratio > 0.3) color = '#ffcc00';
    else color = '#ff2200';

    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, Math.round(barW * ratio), barH);

    // Border
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  // ---- Game Over Screen ----
  drawGameOver(height, score, highScore, isNewRecord) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    // Panel
    const panelX = W * 0.08;
    const panelW = W * 0.84;
    const panelY = H * 0.25;
    const panelH = H * 0.5;

    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 3;
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
      ctx.fillText('★ NEW RECORD! ★', W / 2, panelY + 105);
    } else {
      ctx.fillStyle = '#aaffaa';
      ctx.font = '11px "Courier New"';
      ctx.fillText(`ベスト: ${highScore}m`, W / 2, panelY + 105);
    }

    // Buttons
    const btnY = panelY + panelH - 70;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(panelX + 10, btnY, panelW - 20, 28);
    ctx.font = 'bold 13px "Courier New"';
    ctx.fillStyle = '#000';
    ctx.fillText('▶  もういちど', W / 2, btnY + 19);

    const btn2Y = btnY + 36;
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX + 10, btn2Y, panelW - 20, 24);
    ctx.font = '11px "Courier New"';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('タイトルへ', W / 2, btn2Y + 16);

    ctx.restore();

    // Store button regions for click detection (in game.js)
    this.retryBtnRect = { x: panelX + 10, y: btnY, w: panelW - 20, h: 28 };
    this.titleBtnRect = { x: panelX + 10, y: btn2Y, w: panelW - 20, h: 24 };
  }

  // ---- Pause Screen ----
  drawPause() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.font = 'bold 22px "Courier New"';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', W / 2, H / 2 - 10);
    ctx.font = '11px "Courier New"';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('P / Esc でつづける', W / 2, H / 2 + 16);
    ctx.restore();
  }
}
