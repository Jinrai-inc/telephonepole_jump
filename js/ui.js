'use strict';

class UI {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this.W      = canvas.width;
    this.H      = canvas.height;
    // Button hit-test rects set during draw
    this.retryBtnRect   = null;
    this.titleBtnRect   = null;
    this.rankingBtnRect = null;
    this.startBtnRect   = null;
    this.charBtnRect    = null;
    this.rankBtnRect    = null;
    this.soundBtnRect   = null;
    this.soundHudRect   = null;
    this.backBtnRect    = null;
  }

  resize() { this.W = this.canvas.width; this.H = this.canvas.height; }

  // ---- Helpers ----
  _btn(label, x, y, w, h, fill = '#ffcc00', textColor = '#000', fontSize = 13) {
    const ctx = this.ctx;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.font = `bold ${fontSize}px "Courier New"`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + Math.round(fontSize * 0.35));
    ctx.restore();
    return { x, y, w, h };
  }

  _outlineBtn(label, x, y, w, h, color = '#aaaaaa', fontSize = 11) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.save();
    ctx.font = `${fontSize}px "Courier New"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + Math.round(fontSize * 0.35));
    ctx.restore();
    return { x, y, w, h };
  }

  _panel(x, y, w, h, border = '#ffcc00') {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10,5,0,0.88)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }

  // ---- Title Screen ----
  drawTitle(highScore, animTick, soundEnabled) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a0a3a');
    grad.addColorStop(1, '#ff6633');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#ffffaa';
    [[20,30],[60,15],[100,50],[130,20],[160,45],[40,70],[90,80],[150,65],
     [200,25],[240,55],[280,20],[320,40],[300,70]]
      .forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));

    // Pole silhouette
    this._drawPoleSilhouette(W/2, H*0.08, H*0.52);

    // Title box
    this._panel(W*0.05, H*0.15, W*0.9, 62, '#ffcc00');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('TELEPHONE', W/2, H*0.15+22);
    ctx.font = 'bold 20px "Courier New"';
    ctx.fillStyle = '#ff4400';
    ctx.fillText('POLE JUMP', W/2, H*0.15+48);
    ctx.restore();

    // Best score + nickname
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Courier New"';
    ctx.fillStyle = '#aaffaa';
    ctx.fillText(`BEST: ${highScore}m`, W/2, H*0.15+76);
    const nick = (typeof ranking !== 'undefined' && ranking.nickname) ? ranking.nickname : '';
    if (nick) {
      ctx.font = '10px "Courier New"';
      ctx.fillStyle = '#88aaff';
      ctx.fillText(`${nick} のベスト`, W/2, H*0.15+92);
    }
    ctx.restore();

    // START (blink)
    const blink = Math.floor(animTick/28) % 2 === 0;
    const sY = H*0.72;
    if (blink) {
      this.startBtnRect = this._btn('▶  START', W*0.2, sY, W*0.6, 36, '#ffcc00', '#000', 16);
    } else {
      ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
      ctx.strokeRect(W*0.2, sY, W*0.6, 36);
      ctx.save();
      ctx.font = 'bold 16px "Courier New"'; ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center';
      ctx.fillText('▶  START', W/2, sY+24);
      ctx.restore();
      this.startBtnRect = { x: W*0.2, y: sY, w: W*0.6, h: 36 };
    }

    // Sub-buttons row
    const subY = sY + 44;
    const btnW = W*0.42;
    this.charBtnRect = this._outlineBtn('👤 キャラ選択', W*0.05, subY, btnW, 26, '#aaddff', 10);
    this.rankBtnRect = this._outlineBtn('🏆 ランキング', W*0.53, subY, btnW, 26, '#ffdd88', 10);

    // Controls hint
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '9px "Courier New"';
    ctx.fillStyle = '#888888';
    ctx.fillText('← →キー/スワイプ:方向  スペース/タップ:ジャンプ', W/2, subY+46);
    ctx.restore();

    // Sound toggle
    const sndLabel = soundEnabled ? '🔊' : '🔇';
    this.soundBtnRect = this._outlineBtn(sndLabel, W-34, 8, 26, 22, '#888', 12);
  }

  _drawPoleSilhouette(cx, topY, height) {
    const ctx = this.ctx;
    ctx.fillStyle = '#333';
    ctx.fillRect(cx-4, topY, 8, height);
    ctx.fillRect(cx-30, topY+10, 60, 5);
    ctx.fillRect(cx-20, topY+25, 40, 4);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#555';
      ctx.fillRect(cx-30+i*24, topY+6, 6, 14);
    }
    // Climbing char silhouette on pole
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(cx-5, topY+height*0.55, 10, 16);
    ctx.fillRect(cx-4, topY+height*0.5,  8,  8);
  }

  // ---- HUD ----
  drawHUD(height, score, highScore, timeLeft, timeMax, combo,
          multiplierTimer, multiplierMax, crowWarning, animTick, soundEnabled) {
    const ctx = this.ctx;
    const W   = this.W;

    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, W, 60);

    ctx.save();
    ctx.font = 'bold 13px "Courier New"';

    // Height
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(height)}m`, 8, 17);

    // Score
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`${score}pt`, 8, 33);

    // Best
    ctx.fillStyle = '#aaffaa'; ctx.textAlign = 'center';
    ctx.fillText(`BEST ${highScore}m`, W/2, 17);

    // Combo
    if (combo > 1) {
      const cc = combo >= 10 ? '#ff4400' : combo >= 5 ? '#ff8800' : '#ffcc44';
      ctx.fillStyle = cc;
      ctx.font = 'bold 11px "Courier New"';
      ctx.fillText(`COMBO x${combo}`, W/2, 33);
    }

    // Multiplier (right)
    if (multiplierTimer > 0) {
      const show = multiplierTimer > 1000 || Math.floor(animTick/9) % 2 === 0;
      if (show) {
        ctx.fillStyle = '#ffff00'; ctx.textAlign = 'right';
        ctx.font = 'bold 13px "Courier New"';
        ctx.fillText('x2 ★', W-8, 17);
        // sub-bar
        const ratio = multiplierTimer / multiplierMax;
        const bw = 46, bh = 5, bx = W-54, by = 20;
        ctx.fillStyle = '#444'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#ffff00'; ctx.fillRect(bx, by, Math.round(bw*ratio), bh);
      }
    }

    // Sound toggle (top-right corner of HUD) — tappable 26×20 area
    this.soundHudRect = { x: W-28, y: 0, w: 28, h: 20 };
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(W-28, 0, 28, 20);
    const sndLabel = soundEnabled ? '♪' : '✕';
    ctx.font = 'bold 11px "Courier New"'; ctx.fillStyle = soundEnabled ? '#aaffaa' : '#aa4444';
    ctx.textAlign = 'right';
    ctx.fillText(sndLabel, W-8, 14);

    ctx.restore();

    this._drawTimerBar(timeLeft, timeMax, crowWarning);
    this._drawTapZones();
  }

  _drawTapZones() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const zoneH = 56;
    const zoneY = H - zoneH;

    // Left zone
    ctx.fillStyle = 'rgba(100,180,255,0.10)';
    ctx.fillRect(0, zoneY, W / 2, zoneH);
    ctx.strokeStyle = 'rgba(100,180,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, zoneY + 1, W / 2 - 2, zoneH - 2);
    ctx.save();
    ctx.font = 'bold 22px "Courier New"';
    ctx.fillStyle = 'rgba(180,220,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('◀', W / 4, zoneY + zoneH * 0.62);
    ctx.restore();

    // Right zone
    ctx.fillStyle = 'rgba(100,180,255,0.10)';
    ctx.fillRect(W / 2, zoneY, W / 2, zoneH);
    ctx.strokeStyle = 'rgba(100,180,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(W / 2 + 1, zoneY + 1, W / 2 - 2, zoneH - 2);
    ctx.save();
    ctx.font = 'bold 22px "Courier New"';
    ctx.fillStyle = 'rgba(180,220,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('▶', W * 3 / 4, zoneY + zoneH * 0.62);
    ctx.restore();
  }

  _drawTimerBar(timeLeft, timeMax, crowWarning) {
    const ctx   = this.ctx;
    const W     = this.W;
    const ratio = Math.max(0, timeLeft / timeMax);
    const barX = 8, barY = 48, barW = W-16, barH = 9;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(barX, barY, barW, barH);

    let color = ratio > 0.6 ? '#00cc44' : ratio > 0.3 ? '#ffcc00' : '#ff2200';
    if (crowWarning && ratio > 0.3) color = '#ff8800';

    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, Math.round(barW * ratio), barH);

    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  // ---- Character Select Screen ----
  drawCharSelect(scrollY, animTick) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // BG
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0520'); grad.addColorStop(1, '#201040');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Title
    ctx.save();
    ctx.font = 'bold 16px "Courier New"';
    ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center';
    ctx.fillText('キャラクター選択', W/2, 30);
    ctx.font = '9px "Courier New"';
    ctx.fillStyle = '#888';
    ctx.fillText(`累計 ${charManager.cumulative}m`, W/2, 46);
    ctx.restore();

    // Back button
    this.backBtnRect = this._outlineBtn('◀ もどる', 10, 8, 80, 24, '#aaaaaa', 10);

    // Character grid: 2 columns
    const cols   = 2;
    const cellW  = Math.floor((W - 20) / cols);
    const cellH  = 88;
    const startY = 60 - scrollY;

    this._charSelectRects = [];

    CHARACTERS.forEach((ch, i) => {
      const col   = i % cols;
      const row   = Math.floor(i / cols);
      const cx    = 10 + col * cellW;
      const cy    = startY + row * cellH;

      if (cy + cellH < 55 || cy > H) { this._charSelectRects.push(null); return; }

      const unlocked = charManager.isUnlocked(i);
      const selected = charManager.selected === i;

      // Cell background
      ctx.fillStyle = selected ? 'rgba(255,220,0,0.18)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(cx, cy, cellW-4, cellH-4);
      ctx.strokeStyle = selected ? '#ffcc00' : (unlocked ? '#446688' : '#333');
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(cx, cy, cellW-4, cellH-4);

      // Character preview (draw at centre of left area)
      const previewX = cx + 28;
      const previewY = cy + 58;
      if (unlocked) {
        charRenderer.draw(ctx, i, previewX, previewY, true,
          (animTick * 0.01) % 1, 'idle');
      } else {
        // Silhouette
        ctx.fillStyle = '#333';
        ctx.fillRect(previewX-8, previewY-20, 16, 20);
        ctx.fillRect(previewX-4, previewY-28, 8, 8);
        ctx.fillStyle = '#444';
        ctx.font = '9px "Courier New"'; ctx.textAlign = 'center';
        ctx.fillText('?', previewX, previewY-18);
      }

      // Info
      ctx.save();
      ctx.textAlign = 'left';
      ctx.font = `bold 11px "Courier New"`;
      ctx.fillStyle = unlocked ? (selected ? '#ffcc00' : '#ffffff') : '#555';
      ctx.fillText(ch.name, cx+52, cy+18);

      ctx.font = '9px "Courier New"';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(ch.nameFull, cx+52, cy+32);

      if (!unlocked) {
        ctx.fillStyle = '#886644';
        ctx.fillText(`${ch.cost}m で解放`, cx+52, cy+48);
        // Progress bar
        const prog = Math.min(1, charManager.cumulative / ch.cost);
        ctx.fillStyle = '#333'; ctx.fillRect(cx+52, cy+54, cellW-64, 6);
        ctx.fillStyle = '#ff8822'; ctx.fillRect(cx+52, cy+54, Math.round((cellW-64)*prog), 6);
      } else if (selected) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('▶ 選択中', cx+52, cy+48);
      } else {
        ctx.fillStyle = '#44cc44';
        ctx.fillText('解放済み', cx+52, cy+48);
      }

      ctx.restore();

      this._charSelectRects.push({ x: cx, y: cy, w: cellW-4, h: cellH-4, id: i, unlocked });
    });

    // Scroll hint
    const totalH = Math.ceil(CHARACTERS.length / cols) * cellH + 60;
    if (totalH > H) {
      ctx.save();
      ctx.font = '9px "Courier New"'; ctx.fillStyle = '#666'; ctx.textAlign = 'center';
      ctx.fillText('▼ スクロール', W/2, H-10);
      ctx.restore();
    }
  }

  // ---- Ranking Screen ----
  drawRanking(entries, myHeight, loading) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // BG
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a1520'); grad.addColorStop(1, '#102040');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Title
    ctx.save();
    ctx.font = 'bold 16px "Courier New"'; ctx.fillStyle = '#ffdd88'; ctx.textAlign = 'center';
    ctx.fillText('🏆 ランキング', W/2, 30);
    ctx.restore();

    this.backBtnRect = this._outlineBtn('◀ もどる', 10, 8, 80, 24, '#aaaaaa', 10);

    if (loading) {
      ctx.save();
      ctx.font = '12px "Courier New"'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'center';
      ctx.fillText('ロード中...', W/2, H/2);
      ctx.restore();
      return;
    }

    const rowH = 44;
    const startY = 56;
    const medals = ['🥇','🥈','🥉'];

    if (entries.length === 0) {
      ctx.save();
      ctx.font = '11px "Courier New"'; ctx.fillStyle = '#777'; ctx.textAlign = 'center';
      ctx.fillText('まだ記録がありません', W/2, H/2);
      ctx.restore();
    } else {
      entries.forEach((e, i) => {
        const y = startY + i * rowH;
        if (y + rowH > H - 30) return;

        const isMe = e.height === myHeight;
        ctx.fillStyle = isMe ? 'rgba(255,200,0,0.12)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(10, y, W-20, rowH-4);
        if (isMe) {
          ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 1;
          ctx.strokeRect(10, y, W-20, rowH-4);
        }

        // Rank
        ctx.save();
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        if (i < 3) {
          ctx.fillStyle = '#ffcc00';
          ctx.fillText(medals[i], 30, y+rowH*0.5+5);
        } else {
          ctx.fillStyle = '#888';
          ctx.fillText(`${i+1}`, 30, y+rowH*0.5+5);
        }

        // Character preview
        charRenderer.draw(ctx, e.char || 0, 60, y+rowH-8, true, 0, 'idle');

        // Name & score
        ctx.font = 'bold 11px "Courier New"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        ctx.fillText(e.nick || 'ゲスト', 76, y+16);
        ctx.font = '10px "Courier New"'; ctx.fillStyle = '#ffcc00';
        ctx.fillText(`${e.height}m  ${e.score}pt`, 76, y+30);

        ctx.restore();
      });
    }

    // My rank footer
    if (myHeight > 0) {
      const myRank = ranking.myRank(myHeight);
      ctx.save();
      ctx.font = '10px "Courier New"'; ctx.fillStyle = '#aaaaaa'; ctx.textAlign = 'center';
      ctx.fillText(`あなたの記録: ${myHeight}m  (ローカル${myRank}位)`, W/2, H-14);
      ctx.restore();
    }
  }

  // ---- Nickname Input Screen ----
  drawNicknameInput(inputText, animTick) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    ctx.fillStyle = 'rgba(0,0,0,0.92)'; ctx.fillRect(0, 0, W, H);
    this._panel(W*0.06, H*0.25, W*0.88, H*0.5, '#ffcc00');

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Courier New"'; ctx.fillStyle = '#ffcc00';
    ctx.fillText('ニックネームを入力', W/2, H*0.25+28);
    ctx.font = '10px "Courier New"'; ctx.fillStyle = '#aaaaaa';
    ctx.fillText('(最大12文字)', W/2, H*0.25+44);

    // Input field
    const fw = W*0.76, fh = 32, fx = W*0.12, fy = H*0.25+56;
    ctx.fillStyle = '#111'; ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.font = 'bold 14px "Courier New"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText(inputText, fx+8, fy+22);
    // Cursor blink
    if (Math.floor(animTick/30) % 2 === 0) {
      const tw = ctx.measureText(inputText).width;
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(fx+10+tw, fy+6, 2, 18);
    }

    ctx.restore();

    // OK button
    const okY = H*0.25 + H*0.5 - 44;
    this.nickOkRect = this._btn('決定  ▶', W*0.2, okY, W*0.6, 30, '#ffcc00', '#000', 13);
  }

  // ---- Game Over ----
  drawGameOver(height, score, highScore, isNewRecord, animTick) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, 0, W, H);

    const panelX = W*0.07, panelW = W*0.86;
    const panelY = H*0.20, panelH = H*0.58;
    this._panel(panelX, panelY, panelW, panelH, '#ff4400');

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = 'bold 22px "Courier New"'; ctx.fillStyle = '#ff4400';
    ctx.fillText('GAME OVER', W/2, panelY+32);

    // Show current character
    charRenderer.draw(ctx, charManager.selected, W/2, panelY+72, true, 0, 'slide');

    ctx.font = 'bold 12px "Courier New"'; ctx.fillStyle = '#ffffff';
    ctx.fillText(`高さ: ${Math.floor(height)}m`, W/2, panelY+92);
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`スコア: ${score}pt`, W/2, panelY+112);

    if (isNewRecord) {
      // Blinking new record text
      if (Math.floor(animTick/20) % 2 === 0) {
        ctx.fillStyle = '#ff8800';
        ctx.font = 'bold 15px "Courier New"';
        ctx.fillText('★ NEW RECORD! ★', W/2, panelY+136);
      }
    } else {
      ctx.fillStyle = '#aaffaa'; ctx.font = '11px "Courier New"';
      ctx.fillText(`ベスト: ${highScore}m`, W/2, panelY+136);
    }

    ctx.restore();

    const btnY = panelY + panelH - 92;
    this.retryBtnRect  = this._btn('▶  もういちど', panelX+10, btnY,    panelW-20, 30, '#ffcc00', '#000', 13);
    this.titleBtnRect  = this._outlineBtn('タイトルへ',  panelX+10, btnY+38, Math.floor((panelW-24)/2), 24, '#aaa', 10);
    this.rankingBtnRect = this._outlineBtn('ランキング',  panelX+10+Math.floor((panelW-24)/2)+4, btnY+38, Math.ceil((panelW-24)/2), 24, '#ffdd88', 10);
  }

  // ---- Pause ----
  drawPause() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Courier New"'; ctx.fillStyle = '#ffcc00';
    ctx.fillText('PAUSE', W/2, H/2-12);
    ctx.font = '11px "Courier New"'; ctx.fillStyle = '#999';
    ctx.fillText('P / Esc でつづける', W/2, H/2+14);
    ctx.restore();
  }
}
