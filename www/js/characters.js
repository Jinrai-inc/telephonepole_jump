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
  // ================================================================
  // STAGE-UNLOCKED CHARACTERS (cost: Infinity — unlocked via stages)
  // ================================================================

  // 10 カメ – のろまカメ
  { id:10, name:'カメ', nameFull:'のろまカメ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#447722'; ctx.fillRect(px+2,py+6,12,12); // shell
      ctx.fillStyle='#33aa22'; // shell highlights
      ctx.fillRect(px+4,py+7,4,4); ctx.fillRect(px+9,py+7,3,3); ctx.fillRect(px+5,py+12,5,4);
      ctx.fillStyle='#66cc44'; ctx.fillRect(px+4,py+2,8,6); // head
      ctx.fillStyle='#111'; ctx.fillRect(px+6,py+4,2,1); ctx.fillRect(px+9,py+4,2,1); // eyes
      ctx.fillStyle='#66cc44'; // legs
      ctx.fillRect(px+1,py+12,4,5); ctx.fillRect(px+11,py+12,4,5);
      ctx.fillRect(px+2,py+16,3,4); ctx.fillRect(px+11,py+16,3,4);
      if(a.state==='jump'){ctx.fillStyle='#66cc44';ctx.fillRect(px+2,py+4,3,4);ctx.fillRect(px+11,py+4,3,4);}
    }
  },

  // 11 パンダ – のんびりパンダ
  { id:11, name:'パンダ', nameFull:'のんびりパンダ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#ffffff'; ctx.fillRect(px+3,py+6,10,12); // body
      ctx.fillRect(px+4,py,8,8); // head
      ctx.fillStyle='#111'; // ears
      ctx.fillRect(px+3,py-2,4,4); ctx.fillRect(px+9,py-2,4,4);
      ctx.fillRect(px+4,py+2,3,3); ctx.fillRect(px+9,py+2,3,3); // eye patches
      ctx.fillStyle='#222'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // eyes
      ctx.fillStyle='#333'; ctx.fillRect(px+7,py+6,2,1); // nose
      ctx.fillStyle='#fff'; ctx.fillRect(px+5,py+5,6,2); // muzzle
      ctx.fillStyle='#111'; // arms+legs
      ctx.fillRect(px+1,py+7,4,7); ctx.fillRect(px+11,py+7,4,7);
      ctx.fillRect(px+3,py+16,4,4); ctx.fillRect(px+9,py+16,4,4);
      if(a.state==='jump'){ctx.fillStyle='#111';ctx.fillRect(px+1,py+2,3,6);ctx.fillRect(px+12,py+2,3,6);}
      if(a.state==='slide'){ctx.fillStyle='#111';ctx.fillRect(px-2,py+6,5,2);ctx.fillRect(px+13,py+6,5,2);}
    }
  },

  // 12 カッパ – 川のカッパ
  { id:12, name:'カッパ', nameFull:'川のカッパ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#336633'; ctx.fillRect(px+3,py+8,10,10); // body
      ctx.fillRect(px+4,py+1,8,8); // head
      ctx.fillStyle='#225522'; ctx.fillRect(px+3,py-1,10,3); // dish on head
      ctx.fillStyle='#4488aa'; ctx.fillRect(px+4,py,8,2); // water in dish
      ctx.fillStyle='#88bb44'; ctx.fillRect(px+5,py+4,6,3); // beak/muzzle
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // eyes
      ctx.fillStyle='#336633';
      arms(ctx,px,py+8,f,'#336633',a.state);
      ctx.fillStyle='#225522'; ctx.fillRect(px+3,py+17,5,3); ctx.fillRect(px+8,py+17,5,3); // webbed feet
    }
  },

  // 13 ウサギ – はねっこウサギ
  { id:13, name:'ウサギ', nameFull:'はねっこウサギ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#f0f0f0'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py+1,8,7); // body/head
      ctx.fillStyle='#f0f0f0'; ctx.fillRect(px+4,py-8,3,10); ctx.fillRect(px+9,py-8,3,10); // tall ears
      ctx.fillStyle='#ffaaaa'; ctx.fillRect(px+5,py-7,1,7); ctx.fillRect(px+10,py-7,1,7); // inner ears
      ctx.fillStyle='#ff4488'; ctx.fillRect(px+7,py+5,2,2); // nose
      ctx.fillStyle='#cc2244'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // eyes
      arms(ctx,px,py+8,f,'#f0f0f0',a.state);
      ctx.fillStyle='#f0f0f0'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
      ctx.fillStyle='#ffaaaa'; ctx.fillRect(px+13,py+9,4,4); // fluffy tail
    }
  },

  // 14 キツネ – ずるいキツネ
  { id:14, name:'キツネ', nameFull:'ずるいキツネ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#dd5511'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py,8,8); // body/head
      ctx.fillStyle='#cc4400'; // ears
      ctx.fillRect(px+4,py-3,3,5); ctx.fillRect(px+9,py-3,3,5);
      ctx.fillStyle='#fff'; ctx.fillRect(px+5,py+4,6,4); // muzzle
      ctx.fillRect(px+3,py+8,4,5); ctx.fillRect(px+9,py+8,4,5); // white chest
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+2,2,2); ctx.fillRect(px+9,py+2,2,2); // eyes
      ctx.fillStyle='#222'; ctx.fillRect(px+7,py+5,2,1); // nose
      const tailX=f?px-5:px+13;
      ctx.fillStyle='#dd5511'; ctx.fillRect(tailX,py+8,5,7);
      ctx.fillStyle='#fff'; ctx.fillRect(tailX+(f?-1:1),py+14,3,3); // tail tip
      arms(ctx,px,py+8,f,'#dd5511',a.state);
      ctx.fillStyle='#cc4400'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
    }
  },

  // 15 クマ – がぶがぶクマ
  { id:15, name:'クマ', nameFull:'がぶがぶクマ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#884422'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py,8,9); // body/head
      ctx.fillStyle='#774411'; // round ears
      ctx.fillRect(px+3,py-2,4,4); ctx.fillRect(px+9,py-2,4,4);
      ctx.fillStyle='#bb8855'; ctx.fillRect(px+5,py+4,6,4); // muzzle
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+2,2,2); ctx.fillRect(px+9,py+2,2,2); // eyes
      ctx.fillRect(px+7,py+5,2,2); // nose
      arms(ctx,px,py+8,f,'#884422',a.state);
      ctx.fillStyle='#774411'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
      if(a.state==='jump'){ctx.fillStyle='#884422';ctx.fillRect(px+1,py+2,3,6);ctx.fillRect(px+12,py+2,3,6);}
    }
  },

  // 16 ペンギン – よちよちペンギン
  { id:16, name:'ペンギン', nameFull:'よちよちペンギン', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#111122'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py,8,9); // body/head
      ctx.fillStyle='#f0f0ee'; ctx.fillRect(px+5,py+8,6,8); // white belly
      ctx.fillRect(px+5,py+2,6,6); // white face
      ctx.fillStyle='#ff8800'; ctx.fillRect(px+6,py+5,4,2); // beak
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // eyes
      ctx.fillStyle='#ff8800'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3); // feet
      // flippers
      if(a.state==='jump'){ctx.fillStyle='#111122';ctx.fillRect(px+1,py+6,3,6);ctx.fillRect(px+12,py+6,3,6);}
      else if(a.state==='slide'){ctx.fillStyle='#111122';ctx.fillRect(px-1,py+8,4,2);ctx.fillRect(px+13,py+8,4,2);}
      else{ctx.fillStyle='#111122';ctx.fillRect(px+1,py+8,3,5);ctx.fillRect(px+12,py+8,3,5);}
    }
  },

  // 17 サル – いたずらサル
  { id:17, name:'サル', nameFull:'いたずらサル', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#996633'; ctx.fillRect(px+3,py+6,10,10); ctx.fillRect(px+4,py,8,8); // body/head
      ctx.fillStyle='#ffcc99'; ctx.fillRect(px+5,py+3,6,5); // face
      ctx.fillStyle='#884422'; ctx.fillRect(px+3,py+1,3,4); ctx.fillRect(px+10,py+1,3,4); // ears
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // eyes
      ctx.fillStyle='#884422'; ctx.fillRect(px+7,py+6,2,1); // nose
      // long arms
      ctx.fillStyle='#996633';
      if(a.state==='jump'){ctx.fillRect(px,py,2,8);ctx.fillRect(px+14,py,2,8);}
      else if(a.state==='slide'){ctx.fillRect(px-3,py+6,5,2);ctx.fillRect(px+14,py+6,5,2);}
      else{ctx.fillRect(px+14,py+5,2,7);ctx.fillRect(px,py+7,2,6);}
      ctx.fillStyle='#cc4400'; ctx.fillRect(px+4,py+14,8,5); // red bottom
      ctx.fillStyle='#996633'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3); // feet
      // curly tail
      const tx=f?px-4:px+15;
      ctx.fillStyle='#884422'; ctx.fillRect(tx,py+10,3,3); ctx.fillRect(tx+(f?-2:2),py+8,2,3);
    }
  },

  // 18 ゾウ – でかでかゾウ
  { id:18, name:'ゾウ', nameFull:'でかでかゾウ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#888899'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+3,py,10,8); // body/head
      ctx.fillStyle='#777788'; // big flat ears
      ctx.fillRect(px-1,py+1,5,9); ctx.fillRect(px+12,py+1,5,9);
      ctx.fillStyle='#888899'; ctx.fillRect(px+6,py+7,4,5); // trunk
      ctx.fillStyle='#777788'; ctx.fillRect(px+6,py+11,4,3); ctx.fillRect(px+7,py+13,3,3); // trunk tip
      ctx.fillStyle='#111'; ctx.fillRect(px+4,py+3,2,2); ctx.fillRect(px+10,py+3,2,2); // eyes
      ctx.fillStyle='#fff'; ctx.fillRect(px+5,py+7,2,4); ctx.fillRect(px+9,py+7,2,4); // tusks
      ctx.fillStyle='#777788'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
    }
  },

  // 19 トラ – ストライプトラ
  { id:19, name:'トラ', nameFull:'ストライプトラ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#dd7700'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py,8,9); // body/head
      ctx.fillStyle='#aa4400'; // stripes
      ctx.fillRect(px+3,py+8,2,4); ctx.fillRect(px+11,py+8,2,4);
      ctx.fillRect(px+5,py+10,6,2); ctx.fillRect(px+4,py+14,8,2);
      ctx.fillStyle='#fff'; ctx.fillRect(px+5,py+4,6,4); // muzzle
      ctx.fillStyle='#cc4400'; // ears
      ctx.fillRect(px+4,py-2,3,4); ctx.fillRect(px+9,py-2,3,4);
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+2,2,2); ctx.fillRect(px+9,py+2,2,2); // eyes
      ctx.fillRect(px+7,py+5,2,1); // nose
      const tailX=f?px-4:px+14;
      ctx.fillStyle='#dd7700'; ctx.fillRect(tailX,py+7,3,8);
      ctx.fillStyle='#aa4400'; ctx.fillRect(tailX,py+9,3,2); ctx.fillRect(tailX,py+13,3,2); // tail stripes
      arms(ctx,px,py+8,f,'#dd7700',a.state);
      ctx.fillStyle='#cc6600'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
    }
  },

  // 20 ドラゴン – 炎のドラゴン
  { id:20, name:'ドラゴン', nameFull:'炎のドラゴン', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#881122'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py,8,9); // body/head
      ctx.fillStyle='#660011'; // spines on back
      for(let i=0;i<4;i++) ctx.fillRect(px+(f?14:0)-1,py+3+i*3,3,2);
      ctx.fillStyle='#aa3311'; // wings
      ctx.fillRect(px+(f?13:1),py+6,4,7); ctx.fillRect(px+(f?12:2),py+5,3,3);
      ctx.fillStyle='#ff4400'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // orange eyes
      ctx.fillStyle='#aa3311'; // snout
      ctx.fillRect(px+5,py+6,6,3);
      ctx.fillStyle='#ffaa00'; ctx.fillRect(px+5,py+8,5,2); // flame in mouth
      const tailX=f?px-5:px+13;
      ctx.fillStyle='#881122'; ctx.fillRect(tailX,py+10,4,3); ctx.fillRect(tailX+(f?-2:2),py+8,3,3);
      ctx.fillStyle='#660011'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
      if(a.state==='jump'){ctx.fillStyle='#aa3311';ctx.fillRect(px+(f?12:2),py+1,3,5);}
    }
  },

  // 21 フェニックス – 不死鳥フェニックス
  { id:21, name:'フェニックス', nameFull:'不死鳥フェニックス', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      const fl=Math.floor(a.phase*4)%2;
      ctx.fillStyle='#dd4400'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py+1,8,8); // body/head
      ctx.fillStyle='#ff8800'; // crest
      ctx.fillRect(px+5,py-3,2,5); ctx.fillRect(px+8,py-4,2,6); ctx.fillRect(px+11,py-2,2,4);
      ctx.fillStyle='#ffcc00'; // wing feather tips
      if(a.state==='jump'||fl===0){
        ctx.fillRect(px,py+6,4,8); ctx.fillRect(px+12,py+6,4,8);
      } else {
        ctx.fillRect(px+1,py+8,3,6); ctx.fillRect(px+12,py+8,3,6);
      }
      ctx.fillStyle='#ff4400'; // flame tail
      const ty=py+16+Math.round(Math.sin(a.phase*Math.PI*4)*2);
      ctx.fillRect(px+5,ty,3,6); ctx.fillRect(px+8,ty+2,4,4); ctx.fillRect(px+6,ty+4,4,4);
      ctx.fillStyle='#ffcc00'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // eyes
      ctx.fillStyle='#ff6600'; ctx.fillRect(px+6,py+6,4,2); // beak
    }
  },

  // 22 ユニコーン – 虹のユニコーン
  { id:22, name:'ユニコーン', nameFull:'虹のユニコーン', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#f8f8ff'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py,8,9); // body/head
      ctx.fillStyle='#ddd'; ctx.fillRect(px+8,py-5,2,7); // horn
      ctx.fillStyle='#eeddff'; ctx.fillRect(px+9,py-5,1,6); // horn shine
      const mane=['#ff6688','#ffaa44','#ffdd44','#44cc88','#4488ff'];
      mane.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(px+2+i,py+i,2,3-(i%2)); });
      ctx.fillStyle='#111'; ctx.fillRect(px+6,py+3,2,2); ctx.fillRect(px+10,py+3,2,2); // eyes
      ctx.fillStyle='#ffaacc'; ctx.fillRect(px+7,py+6,2,1); // nose
      arms(ctx,px,py+8,f,'#f8f8ff',a.state);
      ctx.fillStyle='#f0f0ff'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
      // rainbow tail
      const tailColors=['#ff6688','#ffaa44','#44cc88','#4488ff'];
      const tx=f?px-4:px+14;
      tailColors.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(tx,py+8+i*2,3,2); });
    }
  },

  // 23 ケルベロス – 三頭の番犬
  { id:23, name:'ケルベロス', nameFull:'三頭の番犬', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#333344'; ctx.fillRect(px+3,py+8,10,10); // body
      // Three heads
      ctx.fillStyle='#445566'; ctx.fillRect(px+4,py+2,8,7); // center head
      ctx.fillStyle='#334455'; ctx.fillRect(px+1,py+3,6,6); // left head
      ctx.fillRect(px+9,py+3,6,6); // right head
      // Eyes (6 red eyes)
      ctx.fillStyle='#ff2200';
      ctx.fillRect(px+5,py+4,2,1); ctx.fillRect(px+8,py+4,2,1); // center
      ctx.fillRect(px+2,py+5,1,1); ctx.fillRect(px+5,py+5,1,1); // left
      ctx.fillRect(px+10,py+5,1,1); ctx.fillRect(px+13,py+5,1,1); // right
      // Fangs
      ctx.fillStyle='#fff';
      ctx.fillRect(px+5,py+8,1,2); ctx.fillRect(px+7,py+8,1,2); ctx.fillRect(px+9,py+8,1,2);
      ctx.fillStyle='#333344'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
      if(a.state==='jump'){ctx.fillStyle='#334455';ctx.fillRect(px+1,py+5,3,6);ctx.fillRect(px+12,py+5,3,6);}
    }
  },

  // 24 グリフィン – 鷲獅子グリフィン
  { id:24, name:'グリフィン', nameFull:'鷲獅子グリフィン', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#cc9933'; ctx.fillRect(px+3,py+8,10,10); // lion body
      ctx.fillStyle='#ddbb55'; ctx.fillRect(px+4,py+1,8,8); // eagle head
      ctx.fillStyle='#aa7722'; // wings
      ctx.fillRect(px,py+6,4,8); ctx.fillRect(px+12,py+6,4,8);
      ctx.fillRect(px+1,py+4,3,4); ctx.fillRect(px+12,py+4,3,4);
      ctx.fillStyle='#ff9900'; ctx.fillRect(px+5,py+5,6,3); // eagle beak area
      ctx.fillStyle='#ffcc00'; ctx.fillRect(px+6,py+6,3,2); // beak
      ctx.fillStyle='#884400'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // eyes
      const tailX=f?px-4:px+13;
      ctx.fillStyle='#cc9933'; ctx.fillRect(tailX,py+8,3,6);
      ctx.fillStyle='#884400'; ctx.fillRect(tailX+(f?-1:0),py+13,4,3);
      ctx.fillStyle='#ddbb55'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
    }
  },

  // 25 ガーゴイル – 石のガーゴイル
  { id:25, name:'ガーゴイル', nameFull:'石のガーゴイル', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#667788'; ctx.fillRect(px+3,py+6,10,12); ctx.fillRect(px+4,py+1,8,8); // body/head (stone)
      ctx.fillStyle='#556677'; // stone wings
      ctx.fillRect(px,py+5,4,10); ctx.fillRect(px+12,py+5,4,10);
      ctx.fillStyle='#445566'; // wing details
      ctx.fillRect(px+1,py+7,2,6); ctx.fillRect(px+13,py+7,2,6);
      ctx.fillStyle='#ff2200'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // red eyes (glowing)
      ctx.fillStyle='#ffaa00'; ctx.fillRect(px+6,py+4,1,1); ctx.fillRect(px+10,py+4,1,1); // eye glow
      ctx.fillStyle='#445566'; // horns
      ctx.fillRect(px+5,py-1,2,3); ctx.fillRect(px+9,py-1,2,3);
      ctx.fillStyle='#556677'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
    }
  },

  // 26 フェアリー – 光るフェアリー
  { id:26, name:'フェアリー', nameFull:'光るフェアリー', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*2):0; py+=bob;
      const glow=0.3+Math.sin(a.phase*Math.PI*4)*0.2;
      ctx.fillStyle=`rgba(255,220,255,${glow})`; ctx.fillRect(px-2,py-2,20,24); // aura
      ctx.fillStyle='#ffddff'; ctx.fillRect(px+5,py+6,6,10); ctx.fillRect(px+5,py+1,6,6); // tiny body/head
      const wc=['rgba(200,220,255,0.8)','rgba(255,200,255,0.8)'];
      ctx.fillStyle=wc[0]; // wings
      ctx.fillRect(px,py+4,5,8); ctx.fillRect(px+11,py+4,5,8);
      ctx.fillStyle=wc[1];
      ctx.fillRect(px+1,py+5,3,5); ctx.fillRect(px+12,py+5,3,5);
      ctx.fillStyle='#cc66cc'; ctx.fillRect(px+6,py+3,2,2); ctx.fillRect(px+8,py+3,2,2); // eyes
      ctx.fillStyle='#ffaaff'; ctx.fillRect(px+7,py+5,2,1); // nose
      ctx.fillStyle='#ddaadd'; ctx.fillRect(px+5,py+14,3,3); ctx.fillRect(px+8,py+14,3,3); // tiny feet
    }
  },

  // 27 ウィザード – 古代ウィザード
  { id:27, name:'ウィザード', nameFull:'古代ウィザード', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#223388'; ctx.fillRect(px+2,py+8,12,10); // robe
      skin(ctx,px+4,py+2,8,7); // face
      ctx.fillStyle='#223388'; // tall pointed hat
      ctx.fillRect(px+3,py-4,10,8);
      ctx.fillRect(px+5,py-8,6,5); ctx.fillRect(px+6,py-10,4,3); ctx.fillRect(px+7,py-12,2,3);
      ctx.fillStyle='#ffcc00'; ctx.fillRect(px+7,py-6,2,2); // star on hat
      ctx.fillStyle='#ddd'; // white beard
      ctx.fillRect(px+4,py+7,8,4); ctx.fillRect(px+5,py+10,6,4); ctx.fillRect(px+6,py+13,4,4);
      eyes(ctx,px,py+4,f);
      ctx.fillStyle='#223388'; arms(ctx,px,py+8,f,'#223388',a.state);
      pants(ctx,px+3,py+15,'#223388'); shoes(ctx,px,py+18,'#111');
      ctx.fillStyle='#9933cc'; // glowing orb in hand
      ctx.fillRect(f?px+14:px-2,py+9,3,3);
      ctx.fillStyle='rgba(150,50,200,0.5)'; ctx.fillRect(f?px+13:px-3,py+8,5,5);
    }
  },

  // 28 ナイト – 鉄仮面ナイト
  { id:28, name:'ナイト', nameFull:'鉄仮面ナイト', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#778899'; ctx.fillRect(px+3,py+8,10,10); // armor body
      ctx.fillStyle='#889aaa'; ctx.fillRect(px+4,py+1,8,8); // helmet
      ctx.fillStyle='#667788'; // helmet details
      ctx.fillRect(px+4,py+4,8,3); // visor area
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+4,6,2); // visor slit
      ctx.fillStyle='#4455aa'; // cape
      ctx.fillRect(px+(f?0:12),py+7,4,11);
      ctx.fillStyle='#889aaa'; // shoulder plates
      ctx.fillRect(px+1,py+8,4,3); ctx.fillRect(px+11,py+8,4,3);
      ctx.fillStyle='#778899'; arms(ctx,px,py+8,f,'#778899',a.state);
      pants(ctx,px+3,py+15,'#667788'); shoes(ctx,px,py+18,'#556677');
    }
  },

  // 29 サムライ – 戦国サムライ
  { id:29, name:'サムライ', nameFull:'戦国サムライ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#112244'; ctx.fillRect(px+3,py+8,10,10); // kendo gi
      skin(ctx,px+5,py+2,6,5); // face
      ctx.fillStyle='#778899'; // kabuto helmet
      ctx.fillRect(px+3,py-1,10,6); ctx.fillRect(px+4,py-3,8,3);
      ctx.fillStyle='#cc1111'; // shikoro (neck guard)
      ctx.fillRect(px+3,py+4,10,3);
      ctx.fillStyle='#cc2211'; // red menpo (face guard)
      ctx.fillRect(px+5,py+5,6,3);
      ctx.fillStyle='#778899'; // shoulder armor
      ctx.fillRect(px+1,py+8,3,4); ctx.fillRect(px+12,py+8,3,4);
      ctx.fillStyle='#112244'; arms(ctx,px,py+8,f,'#112244',a.state);
      ctx.fillStyle='#111'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
      // Katana
      ctx.fillStyle='#cccccc'; ctx.fillRect(f?px+14:px-4,py+6,2,10);
      ctx.fillStyle='#884400'; ctx.fillRect(f?px+14:px-4,py+5,3,3);
    }
  },

  // 30 ピレート – 荒くれパイレーツ
  { id:30, name:'ピレート', nameFull:'荒くれパイレーツ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#221133'; ctx.fillRect(px+3,py+8,10,10); // dark coat
      skin(ctx,px+4,py+1,8,8);
      ctx.fillStyle='#111'; // tricorn hat
      ctx.fillRect(px+2,py-1,12,4); ctx.fillRect(px+4,py-4,8,4);
      ctx.fillStyle='#eee'; ctx.fillRect(px+5,py,6,3); // hat band
      ctx.fillStyle='#111'; ctx.fillRect(px+7,py-2,2,2); // skull on hat
      ctx.fillStyle='#fff'; ctx.fillRect(px+7,py-2,1,1); ctx.fillRect(px+9,py-2,1,1); // skull eyes
      ctx.fillStyle='#221133'; // eye patch
      ctx.fillRect(px+(f?8:5),py+3,3,2); ctx.fillRect(px+(f?7:5),py+2,5,1);
      eyes(ctx,px,py+4,f);
      ctx.fillStyle='#aa2200'; ctx.fillRect(px+6,py+7,4,1); // scar
      arms(ctx,px,py+8,f,'#f5c88a',a.state);
      pants(ctx,px+3,py+15,'#442266'); shoes(ctx,px,py+18,'#111');
      ctx.fillStyle='#ddaa44'; ctx.fillRect(px+4,py+8,8,2); // belt
    }
  },

  // 31 バイキング – 北欧バイキング
  { id:31, name:'バイキング', nameFull:'北欧バイキング', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#554433'; ctx.fillRect(px+3,py+8,10,10); // fur body
      skin(ctx,px+4,py+1,8,8);
      ctx.fillStyle='#999aaa'; // round helm
      ctx.fillRect(px+3,py-2,10,5); ctx.fillRect(px+4,py-3,8,2);
      ctx.fillStyle='#aaabbb'; // horns
      ctx.fillRect(px+1,py-2,4,3); ctx.fillRect(px+11,py-2,4,3);
      ctx.fillRect(px+0,py-4,3,3); ctx.fillRect(px+13,py-4,3,3);
      ctx.fillStyle='#ccaa88'; // big beard
      ctx.fillRect(px+3,py+7,10,5); ctx.fillRect(px+4,py+11,8,4);
      eyes(ctx,px,py+4,f);
      ctx.fillStyle='#554433'; arms(ctx,px,py+8,f,'#f5c88a',a.state);
      pants(ctx,px+3,py+15,'#443322'); shoes(ctx,px,py+18,'#332211');
      // Axe
      ctx.fillStyle='#888'; ctx.fillRect(f?px+14:px-2,py+8,2,8);
      ctx.fillStyle='#999'; ctx.fillRect(f?px+13:px-3,py+6,4,4);
    }
  },

  // 32 ファラオ – 砂漠のファラオ
  { id:32, name:'ファラオ', nameFull:'砂漠のファラオ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#ffffff'; ctx.fillRect(px+3,py+8,10,10); // white kilt
      skin(ctx,px+4,py+1,8,7);
      // Nemes headdress (gold/blue stripes)
      ctx.fillStyle='#ddaa00'; ctx.fillRect(px+2,py-2,12,6);
      ctx.fillStyle='#0044aa';
      for(let i=0;i<4;i++) ctx.fillRect(px+3+i*3,py-2,1,6);
      ctx.fillStyle='#ddaa00'; // nemes side flaps
      ctx.fillRect(px+1,py+2,3,8); ctx.fillRect(px+12,py+2,3,8);
      ctx.fillStyle='#cc8800'; // gold collar
      ctx.fillRect(px+3,py+7,10,3);
      ctx.fillStyle='#0044aa'; // collar detail
      ctx.fillRect(px+4,py+8,8,1);
      eyes(ctx,px,py+4,f);
      ctx.fillStyle='#111'; // eye kohl
      ctx.fillRect(px+4,py+4,4,1); ctx.fillRect(px+8,py+4,4,1);
      arms(ctx,px,py+8,f,'#f5c88a',a.state);
      ctx.fillStyle='#ffffff'; pants(ctx,px+3,py+15,'#ffffff');
      shoes(ctx,px,py+18,'#ddaa00'); // gold sandals
      // Crook/flail
      ctx.fillStyle='#ddaa00'; ctx.fillRect(f?px+14:px-2,py+9,2,8);
    }
  },

  // 33 エンジェル – 神のエンジェル
  { id:33, name:'エンジェル', nameFull:'神のエンジェル', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='rgba(255,255,200,0.3)'; ctx.fillRect(px-2,py-4,20,26); // soft glow
      ctx.fillStyle='#fffff0'; ctx.fillRect(px+3,py+8,10,10); // white robe
      skin(ctx,px+4,py+1,8,7);
      // Halo
      ctx.strokeStyle='#ffdd44'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(px+8,py-2,7,0,Math.PI*2); ctx.stroke();
      // Wings
      ctx.fillStyle='rgba(255,255,240,0.9)';
      ctx.fillRect(px-2,py+6,6,12); ctx.fillRect(px+12,py+6,6,12);
      ctx.fillStyle='rgba(220,240,255,0.7)';
      ctx.fillRect(px-1,py+7,4,9); ctx.fillRect(px+13,py+7,4,9);
      eyes(ctx,px,py+4,f);
      ctx.fillStyle='#b06060'; ctx.fillRect(px+6,py+7,4,1); // gentle mouth
      arms(ctx,px,py+8,f,'#f5c88a',a.state);
      pants(ctx,px+3,py+15,'#fffff0'); shoes(ctx,px,py+18,'#ffffc0');
    }
  },

  // 34 デーモン – 地獄のデーモン
  { id:34, name:'デーモン', nameFull:'地獄のデーモン', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='rgba(200,0,0,0.25)'; ctx.fillRect(px-2,py-2,20,24); // fire glow
      ctx.fillStyle='#aa1111'; ctx.fillRect(px+3,py+8,10,10); // dark red body
      ctx.fillRect(px+4,py+1,8,8); // head
      // Horns
      ctx.fillStyle='#881100';
      ctx.fillRect(px+4,py-2,3,4); ctx.fillRect(px+9,py-2,3,4);
      ctx.fillRect(px+5,py-4,2,3); ctx.fillRect(px+10,py-4,2,3);
      // Bat wings
      ctx.fillStyle='#550000';
      ctx.fillRect(px,py+6,4,12); ctx.fillRect(px+12,py+6,4,12);
      ctx.fillRect(px-2,py+4,4,4); ctx.fillRect(px+14,py+4,4,4);
      ctx.fillStyle='#dd2200'; // wing membrane
      ctx.fillRect(px+1,py+8,2,8); ctx.fillRect(px+13,py+8,2,8);
      ctx.fillStyle='#ffcc00'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // yellow eyes
      ctx.fillStyle='#ff4400'; ctx.fillRect(px+6,py+7,4,2); // evil grin
      ctx.fillStyle='#fff'; ctx.fillRect(px+6,py+8,1,2); ctx.fillRect(px+9,py+8,1,2); // fangs
      pants(ctx,px+3,py+15,'#550000'); shoes(ctx,px,py+18,'#330000');
    }
  },

  // 35 ロボット – 鉄のロボット
  { id:35, name:'ロボット', nameFull:'鉄のロボット', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#aabbcc'; ctx.fillRect(px+3,py+7,10,11); // metal body
      ctx.fillStyle='#99aabb'; ctx.fillRect(px+4,py+1,8,7); // square head
      ctx.fillStyle='#4488ff'; ctx.fillRect(px+5,py+3,3,2); ctx.fillRect(px+8,py+3,3,2); // LED eyes (blue)
      ctx.fillStyle='#88ccff'; ctx.fillRect(px+6,py+4,1,1); ctx.fillRect(px+9,py+4,1,1); // eye highlight
      ctx.fillStyle='#778899'; // head bolts
      ctx.fillRect(px+4,py+1,2,1); ctx.fillRect(px+10,py+1,2,1); ctx.fillRect(px+4,py+7,2,1); ctx.fillRect(px+10,py+7,2,1);
      ctx.fillStyle='#667788'; ctx.fillRect(px+5,py+6,6,2); // speaker mouth
      ctx.fillStyle='#779900'; // status light
      ctx.fillRect(px+8,py+10,2,2);
      ctx.fillStyle='#aabbcc'; // segmented arms
      if(a.state==='jump'){ctx.fillRect(px+1,py+5,3,7);ctx.fillRect(px+12,py+5,3,7);}
      else if(a.state==='slide'){ctx.fillRect(px-2,py+8,5,2);ctx.fillRect(px+13,py+8,5,2);}
      else{ctx.fillRect(px+13,py+7,2,6);ctx.fillRect(px+1,py+9,2,5);}
      ctx.fillStyle='#99aabb'; // leg segments
      ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
    }
  },

  // 36 エイリアン – 宇宙人エイリアン
  { id:36, name:'エイリアン', nameFull:'宇宙人エイリアン', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*2):0; py+=bob;
      ctx.fillStyle='#33cc66'; ctx.fillRect(px+3,py+7,10,11); // green body
      ctx.fillRect(px+3,py,10,9); // large head (wider)
      // Big almond eyes
      ctx.fillStyle='#111'; ctx.fillRect(px+4,py+3,4,3); ctx.fillRect(px+8,py+3,4,3);
      ctx.fillStyle='#6699ff'; ctx.fillRect(px+5,py+4,2,1); ctx.fillRect(px+9,py+4,2,1); // eye glow
      ctx.fillStyle='#229944'; ctx.fillRect(px+6,py+7,4,1); // small mouth slit
      // Antennae
      ctx.strokeStyle='#22aa44'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px+6,py); ctx.lineTo(px+4,py-5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+10,py); ctx.lineTo(px+12,py-5); ctx.stroke();
      ctx.fillStyle='#ffff44'; ctx.fillRect(px+3,py-6,2,2); ctx.fillRect(px+11,py-6,2,2); // antenna tips
      arms(ctx,px,py+8,f,'#33cc66',a.state);
      ctx.fillStyle='#229944'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
    }
  },

  // 37 スペースマン – 宇宙飛行士
  { id:37, name:'スペースマン', nameFull:'宇宙飛行士', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      ctx.fillStyle='#eeeeff'; ctx.fillRect(px+2,py+7,12,11); // white suit body
      ctx.fillRect(px+3,py,10,9); // round helmet frame
      ctx.strokeStyle='#ccccdd'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(px+8,py+4,5,0,Math.PI*2); ctx.stroke(); // helmet ring
      ctx.fillStyle='#ffcc44'; ctx.fillRect(px+4,py+2,8,5); // gold visor
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(px+4,py+2,8,5); // visor tint
      ctx.fillStyle='#4499ff'; ctx.fillRect(px+5,py+3,2,2); // eyes through visor
      ctx.fillRect(px+9,py+3,2,2);
      ctx.fillStyle='#dd3300'; ctx.fillRect(px+6,py+10,4,2); // mission patch
      ctx.fillStyle='#eeeeff'; arms(ctx,px,py+8,f,'#eeeeff',a.state);
      pants(ctx,px+3,py+15,'#ccccdd'); shoes(ctx,px,py+18,'#aaaacc');
    }
  },

  // 38 サイボーグ – 改造サイボーグ
  { id:38, name:'サイボーグ', nameFull:'改造サイボーグ', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      // Half organic, half machine
      ctx.fillStyle='#3366aa'; ctx.fillRect(px+3,py+8,10,10); // body (shirt)
      ctx.fillStyle='#aabbcc'; ctx.fillRect(px+8,py+8,5,10); // right half metal
      skin(ctx,px+4,py+1,8,7);
      ctx.fillStyle='#99aabb'; ctx.fillRect(px+8,py+1,5,7); // right half metal head
      // Organic left eye
      ctx.fillStyle='#111'; ctx.fillRect(px+5,py+4,2,2);
      // Cyborg right eye (red LED)
      ctx.fillStyle='#ff2200'; ctx.fillRect(px+9,py+4,3,2);
      ctx.fillStyle='#ffaa00'; ctx.fillRect(px+10,py+4,1,1); // LED glow
      // Circuit lines on metal side
      ctx.strokeStyle='#66ffaa'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px+9,py+9); ctx.lineTo(px+12,py+9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+11,py+9); ctx.lineTo(px+11,py+14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+9,py+12); ctx.lineTo(px+13,py+12); ctx.stroke();
      hair(ctx,px+3,py,6,3,'#222'); // half hair
      // Arms: organic left, metal right
      if(a.state==='jump'){
        skin(ctx,px+1,py+2,2,6); ctx.fillStyle='#aabbcc'; ctx.fillRect(px+13,py+2,2,6);
      } else if(a.state==='slide'){
        skin(ctx,px-2,py+8,5,2); ctx.fillStyle='#aabbcc'; ctx.fillRect(px+13,py+8,5,2);
      } else {
        skin(ctx,px+1,py+9,2,5); ctx.fillStyle='#aabbcc'; ctx.fillRect(px+13,py+7,2,6);
      }
      pants(ctx,px+3,py+15,'#3366aa'); ctx.fillStyle='#99aabb'; ctx.fillRect(px+8,py+15,5,5);
      shoes(ctx,px,py+18,'#1a2244'); ctx.fillStyle='#778899'; ctx.fillRect(px+9,py+18,5,2);
    }
  },

  // 39 ゴールドドラゴン – 伝説のゴールドドラゴン
  { id:39, name:'ゴールドドラゴン', nameFull:'伝説のゴールドドラゴン', cost:Infinity,
    draw(ctx,px,py,f,a){
      const bob=a.state==='idle'?Math.round(Math.sin(a.phase*Math.PI*2)*1):0; py+=bob;
      const glow=0.25+Math.sin(a.phase*Math.PI*2)*0.15;
      ctx.fillStyle=`rgba(255,200,0,${glow})`; ctx.fillRect(px-4,py-4,24,28); // gold aura
      ctx.fillStyle='#ffaa00'; ctx.fillRect(px+3,py+6,10,12); // golden body
      ctx.fillRect(px+4,py,8,9); // head
      ctx.fillStyle='#dd8800'; // darker gold details/spines
      for(let i=0;i<5;i++) ctx.fillRect(px+(f?14:0)-1,py+2+i*3,3,2);
      ctx.fillStyle='#ffcc44'; // wings
      ctx.fillRect(px+(f?12:2),py+4,5,9); ctx.fillRect(px+(f?11:1),py+3,4,4);
      ctx.fillStyle='#ffffff'; ctx.fillRect(px+5,py+3,2,2); ctx.fillRect(px+9,py+3,2,2); // white eyes
      ctx.fillStyle='#ffff88'; ctx.fillRect(px+6,py+4,1,1); ctx.fillRect(px+10,py+4,1,1); // eye shine
      ctx.fillStyle='#cc7700'; ctx.fillRect(px+5,py+7,6,3); // snout
      ctx.fillStyle='#ff4400'; ctx.fillRect(px+5,py+9,5,2); // fire breath
      const tailX=f?px-6:px+13;
      ctx.fillStyle='#ffaa00'; ctx.fillRect(tailX,py+9,4,4);
      ctx.fillRect(tailX+(f?-2:2),py+7,3,3);
      ctx.fillStyle='#dd8800'; // tail spines
      ctx.fillRect(tailX,py+8,2,2); ctx.fillRect(tailX+(f?-2:3),py+6,2,2);
      ctx.fillStyle='#cc7700'; ctx.fillRect(px+3,py+17,4,3); ctx.fillRect(px+9,py+17,4,3);
      if(a.state==='slide'){ctx.fillStyle='#ffaa00';ctx.fillRect(px-3,py+5,5,2);ctx.fillRect(px+14,py+5,5,2);}
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
    if (!ch) return false;
    if (ch.cost === Infinity) {
      // Stage-unlocked characters: delegate to stageManager if available
      if (typeof stageManager !== 'undefined') return stageManager.isCharacterUnlocked(id);
      return false;
    }
    return this.cumulative >= ch.cost;
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
