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

  // ---- Title Screen (昭和の空き地) ----
  drawTitle(highScore, animTick, soundEnabled) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // === Sky (summer afternoon) ===
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    skyGrad.addColorStop(0,    '#2255aa');
    skyGrad.addColorStop(0.55, '#66aadd');
    skyGrad.addColorStop(0.85, '#ffcc77');
    skyGrad.addColorStop(1,    '#ff9944');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.62);

    // === Sun ===
    ctx.fillStyle = 'rgba(255,238,100,0.30)';
    ctx.beginPath(); ctx.arc(W * 0.82, 46, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffee44';
    ctx.beginPath(); ctx.arc(W * 0.82, 46, 22, 0, Math.PI * 2); ctx.fill();

    // === Clouds ===
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    this._titleCloud(28, 52, 42);
    this._titleCloud(W - 60, 78, 34);
    this._titleCloud(W * 0.55, 36, 28);

    // === Background building silhouettes ===
    ctx.fillStyle = '#2a3a55';
    ctx.fillRect(0,     H * 0.44, 72, H * 0.20);
    ctx.fillRect(W - 70, H * 0.48, 70, H * 0.16);
    // Windows (lit yellow)
    ctx.fillStyle = '#ffee88';
    for (let wy = 0; wy < 3; wy++) {
      ctx.fillRect(10 + 0  * 22, H * 0.46 + wy * 14, 10, 8);
      ctx.fillRect(10 + 1  * 22, H * 0.46 + wy * 14, 10, 8);
    }
    ctx.fillRect(W - 54, H * 0.50, 10, 8);
    ctx.fillRect(W - 34, H * 0.50, 10, 8);
    ctx.fillRect(W - 54, H * 0.56, 10, 8);

    // === Utility pole ===
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(W/2 - 6, H * 0.05, 12, H * 0.58);
    ctx.fillStyle = '#3a2718';
    ctx.fillRect(W/2 - 6, H * 0.05, 3, H * 0.58);
    // Crossarms
    ctx.fillStyle = '#5a4738';
    ctx.fillRect(W/2 - 38, H * 0.12, 76, 7);
    ctx.fillRect(W/2 - 26, H * 0.20, 52, 5);
    // Insulators
    ctx.fillStyle = '#88aacc';
    for (let i = 0; i < 3; i++) ctx.fillRect(W/2 - 36 + i * 30, H * 0.10, 5, 9);
    // Wires
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(0, H * 0.14 + i * 6);
      ctx.lineTo(W/2 - 36 + i * 30, H * 0.12 + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W/2 - 36 + i * 30, H * 0.12 + 5);
      ctx.lineTo(W, H * 0.17 + i * 6); ctx.stroke();
    }
    // Climbing silhouette on pole
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(W/2 - 5, H * 0.30, 10, 14);
    ctx.fillRect(W/2 - 4, H * 0.25, 8,  9);

    // === Wooden fences ===
    this._woodenFence(0,     H * 0.40, 60, H * 0.24);
    this._woodenFence(W - 56, H * 0.43, 56, H * 0.21);

    // === Ground (dry dirt) ===
    const gnd = ctx.createLinearGradient(0, H * 0.60, 0, H);
    gnd.addColorStop(0,   '#c8903c');
    gnd.addColorStop(0.3, '#b07828');
    gnd.addColorStop(1,   '#8a5c18');
    ctx.fillStyle = gnd;
    ctx.fillRect(0, H * 0.60, W, H * 0.40);
    // Dirt texture
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(0, H * 0.63 + i * 18);
      ctx.lineTo(W, H * 0.645 + i * 18); ctx.stroke();
    }

    // === Grass tufts along ground line ===
    [18, 70, 120, W/2-55, W/2+38, W-85, W-30].forEach(x => {
      this._grassTuft(x, H * 0.615 + (x % 5) * 0.003 * H);
    });

    // === Props: rocks, tire, cardboard box ===
    ctx.fillStyle = '#9a8878'; ctx.fillRect(44, H * 0.68, 18, 7);
    ctx.fillStyle = '#7a6858'; ctx.fillRect(W - 65, H * 0.72, 14, 6);
    // Tire
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(W * 0.83, H * 0.77, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W * 0.83, H * 0.77, 6, 0, Math.PI * 2); ctx.stroke();
    // Cardboard box
    ctx.fillStyle = '#cc9944'; ctx.fillRect(14, H * 0.73, 28, 20);
    ctx.fillStyle = '#aa7722'; ctx.fillRect(14, H * 0.73, 28, 3);
    ctx.strokeStyle = '#884400'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, H * 0.73); ctx.lineTo(28, H * 0.73 + 20); ctx.stroke();

    // === Title sign (wooden board) ===
    const signX = W * 0.06, signY = H * 0.27, signW = W * 0.88, signH = 70;
    ctx.fillStyle = '#bb8833';
    ctx.fillRect(signX, signY, signW, signH);
    // Wood grain
    ctx.strokeStyle = 'rgba(80,40,0,0.15)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(signX, signY + 4 + i * 11);
      ctx.lineTo(signX + signW, signY + 6 + i * 11); ctx.stroke();
    }
    ctx.strokeStyle = '#7a4a10'; ctx.lineWidth = 3;
    ctx.strokeRect(signX, signY, signW, signH);
    // Nails
    ctx.fillStyle = '#5a3408';
    [[signX+6, signY+5],[signX+signW-10, signY+5],
     [signX+6, signY+signH-9],[signX+signW-10, signY+signH-9]]
      .forEach(([nx, ny]) => ctx.fillRect(nx, ny, 4, 4));
    // Sign text
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Courier New"'; ctx.fillStyle = '#3a1800';
    ctx.fillText('TELEPHONE', W/2, signY + 26);
    ctx.font = 'bold 21px "Courier New"'; ctx.fillStyle = '#8b0000';
    ctx.fillText('POLE JUMP', W/2, signY + 54);
    ctx.restore();

    // Best score + nickname
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Courier New"'; ctx.fillStyle = '#ffe8aa';
    ctx.fillText(`BEST: ${highScore}m`, W/2, signY + signH + 18);
    const nick = (typeof ranking !== 'undefined' && ranking.nickname) ? ranking.nickname : '';
    if (nick) {
      ctx.font = '10px "Courier New"'; ctx.fillStyle = '#ffddaa';
      ctx.fillText(`${nick} のベスト`, W/2, signY + signH + 32);
    }
    ctx.restore();

    // START button (endless mode)
    const blink = Math.floor(animTick/28) % 2 === 0;
    const sY = H * 0.69;
    if (blink) {
      this.startBtnRect = this._btn('▶  エンドレスモード', W*0.1, sY, W*0.8, 36, '#ffcc44', '#3a1a00', 14);
    } else {
      ctx.strokeStyle = '#ffcc44'; ctx.lineWidth = 2;
      ctx.strokeRect(W*0.1, sY, W*0.8, 36);
      ctx.save();
      ctx.font = 'bold 14px "Courier New"'; ctx.fillStyle = '#ffcc44'; ctx.textAlign = 'center';
      ctx.fillText('▶  エンドレスモード', W/2, sY + 24);
      ctx.restore();
      this.startBtnRect = { x: W*0.1, y: sY, w: W*0.8, h: 36 };
    }

    // Stage mode button
    const stageY = sY + 44;
    this.stageBtnRect = this._outlineBtn('▶  ステージモード', W*0.1, stageY, W*0.8, 36, '#ffcc44', 14);

    // Sub-buttons row
    const subY = stageY + 44;
    const btnW = W * 0.42;
    this.charBtnRect = this._outlineBtn('👤 キャラ選択', W*0.05, subY, btnW, 26, '#ffddaa', 10);
    this.rankBtnRect = this._outlineBtn('🏆 ランキング', W*0.53, subY, btnW, 26, '#ffddaa', 10);

    // Controls hint
    ctx.save();
    ctx.textAlign = 'center'; ctx.font = '9px "Courier New"'; ctx.fillStyle = '#cc9966';
    ctx.fillText('← →キー / 左右タップ / スワイプ でジャンプ', W/2, subY + 36);
    ctx.restore();

    // Sound toggle
    const sndLabel = soundEnabled ? '🔊' : '🔇';
    this.soundBtnRect = this._outlineBtn(sndLabel, W-34, 8, 26, 22, '#cc9966', 12);
  }

  _titleCloud(x, y, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x,            y,           r * 0.50, 0, Math.PI * 2);
    ctx.arc(x + r * 0.42, y - r * 0.1, r * 0.38, 0, Math.PI * 2);
    ctx.arc(x + r * 0.78, y,           r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  _woodenFence(x, y, w, h) {
    const ctx = this.ctx;
    const pw = 11, gap = 2;
    // Planks
    for (let px = x; px < x + w; px += pw + gap) {
      const cw = Math.min(pw, x + w - px);
      ctx.fillStyle = '#aa8830'; ctx.fillRect(px, y, cw, h);
      ctx.fillStyle = 'rgba(80,40,0,0.18)';
      ctx.fillRect(px + 2, y, 1, h);
      if (cw > 6) ctx.fillRect(px + 6, y, 1, h);
      // Weathered top
      ctx.fillStyle = '#cc9944'; ctx.fillRect(px, y, cw, 3);
    }
    // Horizontal rails
    ctx.fillStyle = '#7a5810';
    ctx.fillRect(x, y,         w, 5);
    ctx.fillRect(x, y + h - 5, w, 5);
    ctx.fillRect(x, y + h * 0.5 - 2, w, 4);
    // Shadow base
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y + h - 3, w, 3);
  }

  _grassTuft(x, y) {
    const ctx = this.ctx;
    const cols = ['#4a7a18', '#5a8a22', '#3a6a10'];
    ctx.strokeStyle = cols[Math.round(x) % 3]; ctx.lineWidth = 1.5;
    [[-4,-10],[-2,-13],[0,-11],[2,-13],[4,-10],[6,-9]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx - 1, y + dy); ctx.stroke();
    });
  }

  // ---- HUD ----
  drawHUD(height, score, highScore, timeLeft, timeMax, combo,
          multiplierTimer, multiplierMax, animTick, soundEnabled, stageInfo = null) {
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

    // Best / Stage info
    if (stageInfo) {
      ctx.fillStyle = '#ffcc44'; ctx.textAlign = 'center';
      ctx.fillText(`STAGE ${stageInfo.stageNum}`, W/2, 17);
      ctx.fillStyle = '#888'; ctx.font = '9px "Courier New"';
      ctx.fillText(`${stageInfo.boltIdx}/${stageInfo.boltGoal}ボルト`, W/2, 30);
      ctx.font = 'bold 13px "Courier New"';
    } else {
      ctx.fillStyle = '#aaffaa'; ctx.textAlign = 'center';
      ctx.fillText(`BEST ${highScore}m`, W/2, 17);
    }

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

    this._drawTimerBar(timeLeft, timeMax);
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

  _drawTimerBar(timeLeft, timeMax) {
    const ctx   = this.ctx;
    const W     = this.W;
    const ratio = Math.max(0, timeLeft / timeMax);
    const barX = 8, barY = 48, barW = W-16, barH = 9;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(barX, barY, barW, barH);

    const color = ratio > 0.6 ? '#00cc44' : ratio > 0.3 ? '#ffcc00' : '#ff2200';
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
        if (ch.cost === Infinity) {
          // Stage-unlocked character
          const reqStage = (typeof STAGE_UNLOCK_MAP !== 'undefined') ? STAGE_UNLOCK_MAP[i] : '?';
          ctx.fillStyle = '#886644';
          ctx.fillText(`ST${reqStage}クリアで解放`, cx+52, cy+48);
          if (typeof stageManager !== 'undefined' && reqStage) {
            const prog = Math.min(1, stageManager.getProgress() / reqStage);
            ctx.fillStyle = '#333'; ctx.fillRect(cx+52, cy+54, cellW-64, 6);
            ctx.fillStyle = '#4488ff'; ctx.fillRect(cx+52, cy+54, Math.round((cellW-64)*prog), 6);
          }
        } else {
          ctx.fillStyle = '#886644';
          ctx.fillText(`${ch.cost}m で解放`, cx+52, cy+48);
          const prog = Math.min(1, charManager.cumulative / ch.cost);
          ctx.fillStyle = '#333'; ctx.fillRect(cx+52, cy+54, cellW-64, 6);
          ctx.fillStyle = '#ff8822'; ctx.fillRect(cx+52, cy+54, Math.round((cellW-64)*prog), 6);
        }
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

    // Online/local indicator + my rank footer
    ctx.save();
    ctx.font = '10px "Courier New"'; ctx.textAlign = 'center';
    if (myHeight > 0) {
      const myRank = ranking.myRank(myHeight);
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`あなたの記録: ${myHeight}m  (ローカル${myRank}位)`, W/2, H-14);
    }
    // Show online/offline status
    const online = ranking.isOnline;
    ctx.fillStyle = online ? '#44cc88' : '#cc4444';
    ctx.textAlign = 'right';
    ctx.fillText(online ? '● オンライン' : '● オフライン（ローカル表示）', W-10, H-14);
    ctx.restore();
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

  // ---- Stage Select Screen ----
  drawStageSelect(progress, currentStage, animTick) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0520'); grad.addColorStop(1, '#201040');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.font = 'bold 15px "Courier New"'; ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center';
    ctx.fillText('ステージ選択', W/2, 28);
    ctx.restore();

    this.backBtnRect    = this._outlineBtn('◀ もどる',   10,    8, 82, 24, '#aaaaaa', 10);
    this.endlessBtnRect = this._outlineBtn('エンドレス', W-96,  8, 86, 24, '#ffddaa', 10);

    this._stageSelectRects = [];

    const themes = ['田舎','都市','ジャングル','海底','砂漠','雪山','火山','宇宙','魔界','天界'];
    const themeColors = [
      '#226600','#223355','#0a4a0a','#003366',
      '#885500','#336688','#660000','#000033','#3a0000','#aaccff'
    ];

    let yPos = 42;

    // ---- Next challenge button ----
    if (progress < 100) {
      const nextStage = progress + 1;
      const tier = Math.floor((nextStage - 1) / 10);
      const blink = Math.floor(animTick / 20) % 2 === 0;
      const btnH = 58;

      ctx.fillStyle = blink ? '#553300' : '#3a2200';
      ctx.fillRect(10, yPos, W - 20, btnH);
      ctx.strokeStyle = '#ffcc44'; ctx.lineWidth = 2;
      ctx.strokeRect(10, yPos, W - 20, btnH);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px "Courier New"'; ctx.fillStyle = '#ffcc44';
      ctx.fillText(`▶  ステージ ${nextStage} に挑戦！`, W / 2, yPos + 24);
      ctx.font = '10px "Courier New"'; ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`テーマ: ${themes[tier]}　タイム: ${(2.00 - 0.14 * tier).toFixed(2)}s`, W / 2, yPos + 44);
      ctx.restore();

      this._stageSelectRects.push({ x: 10, y: yPos, w: W - 20, h: btnH, stage: nextStage, available: true });
      yPos += btnH + 8;
    } else {
      // All 100 cleared
      ctx.save();
      ctx.textAlign = 'center'; ctx.font = 'bold 13px "Courier New"'; ctx.fillStyle = '#ffcc00';
      ctx.fillText('🏆 全100ステージ制覇！', W / 2, yPos + 20);
      ctx.restore();
      yPos += 36;
    }

    // ---- Completed stages grid ----
    if (progress > 0) {
      ctx.save();
      ctx.font = 'bold 10px "Courier New"'; ctx.fillStyle = '#888'; ctx.textAlign = 'left';
      ctx.fillText(`クリア済み  ${progress}/100`, 12, yPos + 14);
      ctx.restore();
      yPos += 20;

      const cols = 8;
      const cellSize = Math.floor((W - 16) / cols);
      const maxRows = Math.floor((H - yPos - 24) / cellSize);

      // Show most recent stages last (or show all if they fit)
      const startStage = Math.max(1, progress - cols * maxRows + 1);

      for (let s = startStage; s <= progress; s++) {
        const i = s - startStage;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const tier = Math.floor((s - 1) / 10);
        const cx = 8 + col * cellSize;
        const cy = yPos + row * cellSize;
        const isSelected = s === currentStage;

        if (cy + cellSize > H - 20) break;

        ctx.fillStyle = isSelected ? '#1a6633' : themeColors[tier];
        ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        ctx.strokeStyle = isSelected ? '#ffcc00' : '#33aa55';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

        ctx.save();
        ctx.font = '8px "Courier New"'; ctx.fillStyle = '#44ff88'; ctx.textAlign = 'center';
        ctx.fillText(s, cx + cellSize / 2, cy + cellSize / 2 + 4);
        ctx.restore();

        this._stageSelectRects.push({ x: cx + 1, y: cy + 1, w: cellSize - 2, h: cellSize - 2, stage: s, available: true });
      }

      if (startStage > 1) {
        ctx.save();
        ctx.font = '9px "Courier New"'; ctx.fillStyle = '#666'; ctx.textAlign = 'center';
        ctx.fillText(`(最近の ${cols * maxRows} ステージを表示)`, W / 2, H - 10);
        ctx.restore();
      }
    } else {
      ctx.save();
      ctx.font = '11px "Courier New"'; ctx.fillStyle = '#555'; ctx.textAlign = 'center';
      ctx.fillText('クリアするとここに記録されます', W / 2, H * 0.72);
      ctx.restore();
    }
  }

  // ---- Stage Complete Screen ----
  drawStageComplete(stageNum, score, animTick, unlockToast) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H);

    const panelX = W * 0.07, panelW = W * 0.86;
    const panelY = H * 0.17, panelH = H * 0.64;
    this._panel(panelX, panelY, panelW, panelH, '#ffcc00');

    ctx.save();
    ctx.textAlign = 'center';

    const blink = Math.floor(animTick / 14) % 2 === 0;
    ctx.font = 'bold 22px "Courier New"';
    ctx.fillStyle = blink ? '#ffff55' : '#ffcc00';
    ctx.fillText('STAGE CLEAR!', W / 2, panelY + 36);

    ctx.font = 'bold 13px "Courier New"'; ctx.fillStyle = '#ffffff';
    ctx.fillText(`ステージ ${stageNum} クリア！`, W / 2, panelY + 58);

    // Stars
    ctx.font = 'bold 24px "Courier New"'; ctx.fillStyle = '#ffcc00';
    ['★', '★', '★'].forEach((s, i) => ctx.fillText(s, W / 2 - 28 + i * 28, panelY + 88));

    ctx.font = 'bold 12px "Courier New"'; ctx.fillStyle = '#ffcc00';
    ctx.fillText(`スコア: ${score}pt`, W / 2, panelY + 114);

    if (unlockToast) {
      ctx.fillStyle = '#00ffaa';
      ctx.font = 'bold 11px "Courier New"';
      ctx.fillText(`キャラ解放: ${unlockToast}！`, W / 2, panelY + 136);
    }

    if (stageNum < 100) {
      ctx.fillStyle = '#aaaaaa'; ctx.font = '10px "Courier New"';
      ctx.fillText(`次: ステージ ${stageNum + 1}`, W / 2, panelY + 158);
    } else {
      ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 12px "Courier New"';
      ctx.fillText('全ステージ制覇！', W / 2, panelY + 158);
    }

    ctx.restore();

    const btnY = panelY + panelH - 86;
    if (stageNum < 100) {
      this.nextStageBtnRect = this._btn('▶ 次のステージ', panelX + 10, btnY, panelW - 20, 30, '#ffcc00', '#000', 12);
    } else {
      this.nextStageBtnRect = null;
    }
    this.titleBtnRect = this._outlineBtn('タイトルへ', panelX + 10, btnY + 38, panelW - 20, 24, '#aaa', 10);
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
