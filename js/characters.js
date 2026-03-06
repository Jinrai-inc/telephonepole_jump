'use strict';

// ---- Character definitions -----------------------------------------------
// Each character has a draw(ctx, px, py, facing, anim) function.
// px/py = top-left of the 16×20 sprite box (feet at py+20).
// facing: true = right, false = left.
// anim: { phase: 0..1 float, state: 'idle'|'jump'|'slide' }

const CHARACTERS = [
  // ------------------------------------------------------------------
  // 0  ケンちゃん – 昭和のガキ大将 (default, always unlocked)
  // ------------------------------------------------------------------
  {
    id: 0, name: 'ケンちゃん', nameFull: 'ガキ大将 ケンちゃん',
    cost: 0,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      skin(ctx, px+4, py,   8, 8);          // head
      hair(ctx, px+3, py,   10,3, '#3b1f0a'); // hair
      eyes(ctx, px, py+4, f);
      mouth(ctx, px+6, py+7);
      body(ctx, px+3, py+8, 10,7, '#2255cc');
      arms(ctx, px, py+8, f, '#f5c88a', a.state);
      pants(ctx, px+3, py+15, '#553311');
      shoes(ctx, px, py+18);
    }
  },
  // ------------------------------------------------------------------
  // 1  ポチ – やんちゃ犬
  // ------------------------------------------------------------------
  {
    id: 1, name: 'ポチ', nameFull: 'やんちゃ犬 ポチ',
    cost: 500,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      // Body (shiba-inu tan)
      ctx.fillStyle = '#cc8833'; ctx.fillRect(px+3, py+6, 10, 12);
      // Head
      ctx.fillStyle = '#cc8833'; ctx.fillRect(px+4, py, 8, 9);
      // Floppy ears
      ctx.fillStyle = '#aa6622';
      ctx.fillRect(px+2,  py+1, 3, 6);
      ctx.fillRect(px+11, py+1, 3, 6);
      // Muzzle
      ctx.fillStyle = '#eebb88'; ctx.fillRect(px+5, py+4, 6, 4);
      // Nose
      ctx.fillStyle = '#221100'; ctx.fillRect(px+7, py+4, 2, 2);
      // Eyes
      ctx.fillStyle = '#221100';
      ctx.fillRect(px+5, py+2, 2, 2);
      ctx.fillRect(px+9, py+2, 2, 2);
      // Tail (curled up, wagging)
      ctx.fillStyle = '#cc8833';
      const tailX = f ? px - 3 : px + 15;
      const wag = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 4) * 2) : 0;
      ctx.fillRect(tailX, py + 4 + wag, 3, 4);
      ctx.fillRect(tailX + (f ? -2 : 2), py + 2 + wag, 3, 3);
      // Paws
      ctx.fillStyle = '#eebb88';
      ctx.fillRect(px+3, py+17, 4, 3);
      ctx.fillRect(px+9, py+17, 4, 3);
      // Jump: arms (front paws) up
      if (a.state === 'jump') {
        ctx.fillStyle = '#cc8833';
        ctx.fillRect(px+1,  py+2, 3, 5);
        ctx.fillRect(px+12, py+2, 3, 5);
      } else if (a.state === 'slide') {
        ctx.fillStyle = '#cc8833';
        ctx.fillRect(px-2,  py+5, 5, 2);
        ctx.fillRect(px+13, py+5, 5, 2);
      }
    }
  },
  // ------------------------------------------------------------------
  // 2  ハナちゃん – おてんば女の子
  // ------------------------------------------------------------------
  {
    id: 2, name: 'ハナちゃん', nameFull: 'おてんば ハナちゃん',
    cost: 1000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      skin(ctx, px+4, py,   8, 8);
      hair(ctx, px+2, py,   12,4, '#994422');  // longer hair
      // Pigtails
      ctx.fillStyle = '#994422';
      ctx.fillRect(px+2, py+2, 2, 5);
      ctx.fillRect(px+12, py+2, 2, 5);
      eyes(ctx, px, py+4, f);
      mouth(ctx, px+6, py+7);
      body(ctx, px+3, py+8, 10,7, '#ff6699');  // pink
      arms(ctx, px, py+8, f, '#f5c88a', a.state);
      pants(ctx, px+3, py+15, '#ffaacc');       // skirt (light pink)
      shoes(ctx, px, py+18);
    }
  },
  // ------------------------------------------------------------------
  // 3  タツじい – おじいちゃん
  // ------------------------------------------------------------------
  {
    id: 3, name: 'タツじい', nameFull: 'ゆかいな おじいちゃん',
    cost: 2000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      // Wrinkled skin (slightly different tone)
      ctx.fillStyle = '#e8b87c'; ctx.fillRect(px+4, py, 8, 8);
      hair(ctx, px+3, py,   10,3, '#cccccc');  // grey hair
      eyes(ctx, px, py+4, f);
      // Wrinkle lines
      ctx.fillStyle = '#c09050';
      ctx.fillRect(px+5, py+6, 1, 1);
      ctx.fillRect(px+10, py+6, 1, 1);
      mouth(ctx, px+6, py+7);
      body(ctx, px+3, py+8, 10,7, '#887766');  // grey-brown
      arms(ctx, px, py+8, f, '#e8b87c', a.state);
      pants(ctx, px+3, py+15, '#554433');
      shoes(ctx, px, py+18);
    }
  },
  // ------------------------------------------------------------------
  // 4  タマ – 野良猫
  // ------------------------------------------------------------------
  {
    id: 4, name: 'タマ', nameFull: 'のらねこ タマ',
    cost: 3000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      // Orange cat body
      ctx.fillStyle = '#ff8833'; ctx.fillRect(px+3, py+2, 10, 16);
      // Head
      ctx.fillRect(px+4, py, 8, 9);
      // Cat ears
      ctx.fillStyle = '#ff6622';
      ctx.fillRect(px+4,  py-2, 3, 3);
      ctx.fillRect(px+9,  py-2, 3, 3);
      // Cat face
      ctx.fillStyle = '#ffcc88'; ctx.fillRect(px+5, py+4, 6, 4); // muzzle
      ctx.fillStyle = '#111';
      if (f) { ctx.fillRect(px+5, py+3, 2, 2); ctx.fillRect(px+9, py+3, 2, 2); }
      else   { ctx.fillRect(px+5, py+3, 2, 2); ctx.fillRect(px+9, py+3, 2, 2); }
      ctx.fillStyle = '#ff5566'; ctx.fillRect(px+7, py+6, 2, 1); // nose
      // Stripes
      ctx.fillStyle = '#cc5511';
      ctx.fillRect(px+3, py+4,  2, 2);
      ctx.fillRect(px+11,py+4,  2, 2);
      ctx.fillRect(px+3, py+10, 2, 2);
      ctx.fillRect(px+11,py+10, 2, 2);
      // Tail
      ctx.fillStyle = '#ff8833';
      const tailX = f ? px-3 : px+15;
      ctx.fillRect(tailX, py+12, 3, 3);
      ctx.fillRect(tailX + (f?-2:2), py+9, 3, 3);
      // Paws (feet)
      ctx.fillStyle = '#ffaa66';
      ctx.fillRect(px+3, py+17, 4, 3);
      ctx.fillRect(px+9, py+17, 4, 3);
    }
  },
  // ------------------------------------------------------------------
  // 5  ライオン – 百獣の王
  // ------------------------------------------------------------------
  {
    id: 5, name: 'ライオン', nameFull: '百獣の王 ライオン',
    cost: 5000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      // Body (golden)
      ctx.fillStyle = '#ddaa33'; ctx.fillRect(px+3, py+6, 10, 12);
      // Mane (dark brown around head)
      ctx.fillStyle = '#7a3300'; ctx.fillRect(px+2, py-1, 12, 12);
      // Head (golden inside mane)
      ctx.fillStyle = '#ffcc55'; ctx.fillRect(px+4, py+1, 8, 8);
      // Ears (small, peeking above mane)
      ctx.fillStyle = '#cc8833';
      ctx.fillRect(px+3,  py-2, 3, 3);
      ctx.fillRect(px+10, py-2, 3, 3);
      // Muzzle
      ctx.fillStyle = '#ffddaa'; ctx.fillRect(px+5, py+5, 6, 4);
      // Nose
      ctx.fillStyle = '#cc5533'; ctx.fillRect(px+7, py+5, 2, 2);
      // Eyes (golden amber)
      ctx.fillStyle = '#cc6600';
      ctx.fillRect(px+5, py+2, 2, 2);
      ctx.fillRect(px+9, py+2, 2, 2);
      // Tail with tuft
      ctx.fillStyle = '#ddaa33';
      const tailX = f ? px - 3 : px + 15;
      ctx.fillRect(tailX, py + 6, 3, 8);
      ctx.fillStyle = '#7a3300';
      ctx.fillRect(tailX + (f ? -2 : 0), py + 13, 5, 4);
      // Paws
      ctx.fillStyle = '#ffddaa';
      ctx.fillRect(px+3, py+17, 4, 3);
      ctx.fillRect(px+9, py+17, 4, 3);
      // Jump: paws up
      if (a.state === 'jump') {
        ctx.fillStyle = '#ddaa33';
        ctx.fillRect(px+1,  py+1, 3, 6);
        ctx.fillRect(px+12, py+1, 3, 6);
      } else if (a.state === 'slide') {
        ctx.fillStyle = '#ddaa33';
        ctx.fillRect(px-2,  py+5, 5, 2);
        ctx.fillRect(px+13, py+5, 5, 2);
      }
    }
  },
  // ------------------------------------------------------------------
  // 6  ユキさん – 雪国の女の子
  // ------------------------------------------------------------------
  {
    id: 6, name: 'ユキさん', nameFull: '雪国の女の子 ユキさん',
    cost: 8000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      skin(ctx, px+4, py,   8, 8);
      hair(ctx, px+2, py,   12,3, '#222');  // long black hair
      ctx.fillStyle = '#222';
      ctx.fillRect(px+2, py+3, 2, 10);   // hair flowing left
      ctx.fillRect(px+12,py+3, 2, 10);   // hair flowing right
      eyes(ctx, px, py+4, f);
      mouth(ctx, px+6, py+7);
      // Kimono (white/light blue)
      ctx.fillStyle = '#ddeeff'; ctx.fillRect(px+2, py+8, 12, 7);
      // Kimono pattern (snowflake dots)
      ctx.fillStyle = '#99ccff';
      ctx.fillRect(px+4, py+10, 2, 2); ctx.fillRect(px+9, py+10, 2, 2);
      ctx.fillRect(px+6, py+13, 2, 2);
      // Obi (sash)
      ctx.fillStyle = '#ff6699'; ctx.fillRect(px+3, py+13, 10, 2);
      arms(ctx, px, py+8, f, '#f5c88a', a.state);
      pants(ctx, px+3, py+15, '#ddeeff');  // kimono skirt
      shoes(ctx, px, py+18, '#cc3366');    // red tabi
    }
  },
  // ------------------------------------------------------------------
  // 7  テツオ – 番長
  // ------------------------------------------------------------------
  {
    id: 7, name: 'テツオ', nameFull: '番長 テツオ',
    cost: 12000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      skin(ctx, px+4, py,   8, 8);
      // Pompadour
      ctx.fillStyle = '#111';
      ctx.fillRect(px+2, py-3, 12, 5);   // pompadour base
      ctx.fillRect(px+3, py-5, 10, 3);   // pompadour top
      eyes(ctx, px, py+4, f);
      // Stern mouth
      ctx.fillStyle = '#883322'; ctx.fillRect(px+6, py+7, 4, 1);
      // Long gakuran (black school uniform)
      ctx.fillStyle = '#111'; ctx.fillRect(px+2, py+8, 12, 10);
      // Collar
      ctx.fillStyle = '#333';
      ctx.fillRect(px+5, py+8, 2, 4);
      ctx.fillRect(px+9, py+8, 2, 4);
      arms(ctx, px, py+8, f, '#f5c88a', a.state);
      pants(ctx, px+3, py+15, '#111');
      shoes(ctx, px, py+18, '#111');
    }
  },
  // ------------------------------------------------------------------
  // 8  ニンジャ – 忍者
  // ------------------------------------------------------------------
  {
    id: 8, name: 'ニンジャ', nameFull: 'かくれ忍者',
    cost: 18000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      // All black suit
      ctx.fillStyle = '#111'; ctx.fillRect(px+3, py, 10, 20);
      // Head wrap (mask)
      ctx.fillRect(px+4, py,   8, 8);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(px+4, py+2, 8, 4); // face covering
      // Ninja eyes only (narrow)
      ctx.fillStyle = '#ff4422';  // red eyes glow
      if (f) { ctx.fillRect(px+5, py+3, 2, 1); ctx.fillRect(px+9, py+3, 2, 1); }
      else   { ctx.fillRect(px+5, py+3, 2, 1); ctx.fillRect(px+9, py+3, 2, 1); }
      // Headband
      ctx.fillStyle = '#662200'; ctx.fillRect(px+4, py+1, 8, 2);
      // Belt
      ctx.fillStyle = '#333'; ctx.fillRect(px+3, py+13, 10, 2);
      // Shuriken glint on side
      ctx.fillStyle = '#888';
      ctx.fillRect(f ? px+14 : px-2, py+11, 2, 2);
      arms(ctx, px, py+8, f, '#111', a.state);
      pants(ctx, px+3, py+15, '#111');
      shoes(ctx, px, py+18, '#222');
    }
  },
  // ------------------------------------------------------------------
  // 9  ゴールドケン – 金色ケンちゃん
  // ------------------------------------------------------------------
  {
    id: 9, name: 'ゴールドケン', nameFull: '伝説 ゴールドケンちゃん',
    cost: 30000,
    draw(ctx, px, py, f, a) {
      const bob = a.state === 'idle' ? Math.round(Math.sin(a.phase * Math.PI * 2) * 1) : 0;
      py += bob;
      // Golden glow aura
      ctx.fillStyle = 'rgba(255,220,0,0.2)';
      ctx.fillRect(px-2, py-2, 20, 24);
      // Same shape as Ken but gold palette
      ctx.fillStyle = '#ffe066'; ctx.fillRect(px+4, py, 8, 8);
      hair(ctx, px+3, py,   10,3, '#cc9900');
      // Golden eyes
      ctx.fillStyle = '#cc6600';
      if (f) { ctx.fillRect(px+5, py+4, 2, 2); ctx.fillRect(px+9, py+4, 2, 2); }
      else   { ctx.fillRect(px+5, py+4, 2, 2); ctx.fillRect(px+9, py+4, 2, 2); }
      ctx.fillStyle = '#cc6600'; ctx.fillRect(px+6, py+7, 4, 1);
      body(ctx, px+3, py+8, 10,7, '#ffcc00');
      arms(ctx, px, py+8, f, '#ffe066', a.state);
      pants(ctx, px+3, py+15, '#cc9900');
      shoes(ctx, px, py+18, '#aa7700');
    }
  },
];

// ---- Shared pixel-art primitives ----------------------------------------

function skin(ctx, x, y, w, h) {
  ctx.fillStyle = '#f5c88a';
  ctx.fillRect(x, y, w, h);
}

function hair(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function eyes(ctx, px, py, facingRight) {
  ctx.fillStyle = '#111';
  ctx.fillRect(px+5, py, 2, 2);
  ctx.fillRect(px+9, py, 2, 2);
}

function mouth(ctx, x, y) {
  ctx.fillStyle = '#b05030';
  ctx.fillRect(x, y, 4, 1);
}

function body(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function arms(ctx, px, py, facingRight, skinColor, state) {
  ctx.fillStyle = skinColor;
  if (state === 'jump') {
    // Both arms up while jumping
    ctx.fillRect(px+1,  py-2, 2, 6);
    ctx.fillRect(px+13, py-2, 2, 6);
  } else if (state === 'slide') {
    // Arms splayed out in panic
    ctx.fillRect(px-2,  py+2, 5, 2);
    ctx.fillRect(px+13, py+2, 5, 2);
  } else {
    // Normal: right arm up gripping pole
    ctx.fillRect(px+13, py-1, 2, 5);
    ctx.fillRect(px+1,  py+2, 2, 4);
  }
}

function pants(ctx, px, py, color) {
  ctx.fillStyle = color;
  ctx.fillRect(px,   py, 4, 5);
  ctx.fillRect(px+6, py, 4, 5);
}

function shoes(ctx, px, py, color = '#111') {
  ctx.fillStyle = color;
  ctx.fillRect(px+2,  py, 5, 2);
  ctx.fillRect(px+9,  py, 5, 2);
}

// ---- CharacterRenderer --------------------------------------------------
// Wraps character drawing with flip transform and anim phase.

class CharacterRenderer {
  draw(ctx, charId, sx, sy, facingRight, animPhase, animState) {
    const ch = CHARACTERS[charId] || CHARACTERS[0];
    const px = Math.round(sx - 8);  // 16px wide, centred on sx
    const py = Math.round(sy - 20); // 20px tall, feet at sy

    ctx.save();
    if (!facingRight) {
      // Flip around the character centre
      ctx.translate(sx, sy - 10);
      ctx.scale(-1, 1);
      ctx.translate(-sx, -(sy - 10));
    }
    ch.draw(ctx, px, py, facingRight, { phase: animPhase, state: animState });
    ctx.restore();
  }
}

const charRenderer = new CharacterRenderer();

// ---- Unlock / Progress ---------------------------------------------------

class CharacterManager {
  constructor() {
    this.cumulative = parseInt(localStorage.getItem('tpj_cumulative') || '0', 10);
    this.selected   = parseInt(localStorage.getItem('tpj_selected')   || '0', 10);
    // Migration: ensure selected is unlocked
    if (!this.isUnlocked(this.selected)) this.selected = 0;
  }

  isUnlocked(id) {
    const ch = CHARACTERS[id];
    return ch && this.cumulative >= ch.cost;
  }

  addCumulative(meters) {
    this.cumulative += meters;
    localStorage.setItem('tpj_cumulative', this.cumulative);
  }

  selectCharacter(id) {
    if (!this.isUnlocked(id)) return false;
    this.selected = id;
    localStorage.setItem('tpj_selected', id);
    return true;
  }

  getSelected() {
    return CHARACTERS[this.selected] || CHARACTERS[0];
  }

  getAll() { return CHARACTERS; }
}

const charManager = new CharacterManager();
