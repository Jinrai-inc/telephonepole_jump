'use strict';

// ---- FlyingEntity --------------------------------------------------------
// Decorative objects that fly horizontally across the screen.
// Which type appears depends on the current altitude zone:
//   <50m   : bird      (street level)
//   <100m  : ptero     (rooftop / prehistoric)
//   <200m  : plane     (cloud layer)
//   <350m  : ship      (upper atmosphere / space entry)
//   350m+  : ufo       (deep space)

class FlyingEntity {
  constructor(type, fromLeft, worldY) {
    this.type   = type;
    this.worldY = worldY;
    this.active = true;
    this.phase  = Math.random() * Math.PI * 2;

    const baseSpeed = { bird: 65, ptero: 58, plane: 145, ship: 100, ufo: 52 };
    const speed = (baseSpeed[type] || 80) + Math.random() * 40;
    this.x  = fromLeft ? -75 : CANVAS_W + 75;
    this.vx = fromLeft ? speed : -speed;
    // Rockets fly diagonally upward (positive = up in world coords)
    this.vy = type === 'ship' ? 45 + Math.random() * 25 : 0;
  }

  update(dt) {
    this.x      += this.vx * (dt / 1000);
    this.worldY += this.vy * (dt / 1000); // ship climbs upward
    this.phase  += dt * 0.005;
    if (this.vx > 0 && this.x > CANVAS_W + 85) this.active = false;
    if (this.vx < 0 && this.x < -85)            this.active = false;
  }

  draw(ctx, sy) {
    if (!this.active) return;
    const x = Math.round(this.x), y = Math.round(sy);
    ctx.save();
    // Entities are drawn facing right by default; flip for left-moving ones.
    if (this.vx < 0) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }
    // Rocket tilts 45° so nose points diagonally in flight direction.
    if (this.type === 'ship') {
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.translate(-x, -y);
    }
    switch (this.type) {
      case 'bird':  this._drawBird (ctx, x, y); break;
      case 'ptero': this._drawPtero(ctx, x, y); break;
      case 'plane': this._drawPlane(ctx, x, y); break;
      case 'ship':  this._drawShip (ctx, x, y); break;
      case 'ufo':   this._drawUfo  (ctx, x, y); break;
    }
    ctx.restore();
  }

  // ---- Bird (small, flapping wings) ----
  _drawBird(ctx, x, y) {
    const w = Math.round(Math.sin(this.phase * 10) * 4);
    // Body
    ctx.fillStyle = '#334455'; ctx.fillRect(x - 5, y, 10, 4);
    // Head
    ctx.fillRect(x + 4, y - 3, 4, 4);
    // Beak
    ctx.fillStyle = '#cc9900'; ctx.fillRect(x + 8, y - 1, 3, 1);
    // Eye
    ctx.fillStyle = '#ffccaa'; ctx.fillRect(x + 5, y - 2, 1, 1);
    // Wings (flapping)
    ctx.fillStyle = '#445566';
    ctx.fillRect(x - 12, y - 1 - w, 8, 3);
    ctx.fillRect(x + 4,  y - 1 - w, 8, 3);
  }

  // ---- Pterodactyl (large, prehistoric) ----
  _drawPtero(ctx, x, y) {
    const w = Math.round(Math.sin(this.phase * 6) * 5);
    // Body
    ctx.fillStyle = '#6b4226'; ctx.fillRect(x - 8, y, 16, 7);
    // Neck + head
    ctx.fillRect(x + 7, y - 5, 14, 5);
    // Crest on head
    ctx.fillRect(x + 7, y - 11, 3, 7);
    // Beak tip
    ctx.fillStyle = '#c86428'; ctx.fillRect(x + 20, y - 4, 5, 2);
    // Eye
    ctx.fillStyle = '#ff8844'; ctx.fillRect(x + 10, y - 4, 2, 2);
    // Wings
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(x - 26, y - w, 20, 5);
    ctx.fillRect(x + 6,  y - w, 20, 5);
    // Wing membrane hint
    ctx.fillStyle = 'rgba(139,94,60,0.35)';
    ctx.fillRect(x - 24, y - w + 4, 18, 4);
    ctx.fillRect(x + 6,  y - w + 4, 18, 4);
  }

  // ---- Airplane ----
  _drawPlane(ctx, x, y) {
    // Fuselage
    ctx.fillStyle = '#ddeeff'; ctx.fillRect(x - 22, y - 3, 42, 7);
    // Nose cone
    ctx.fillStyle = '#b0c4d8'; ctx.fillRect(x + 19, y - 2, 7, 5);
    // Tail fin
    ctx.fillStyle = '#aabbc8'; ctx.fillRect(x - 27, y - 8, 7, 6);
    // Tail stabilizer
    ctx.fillRect(x - 24, y + 3, 6, 3);
    // Wings
    ctx.fillStyle = '#c0d0e0';
    ctx.fillRect(x - 14, y + 3, 28, 5);
    ctx.fillRect(x - 12, y - 3, 24, 4);
    // Windows
    ctx.fillStyle = '#88ccff';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 15 + i * 7, y - 1, 4, 3);
    // Engine pod
    ctx.fillStyle = '#667788'; ctx.fillRect(x - 5, y + 7, 12, 5);
    ctx.fillStyle = '#445566'; ctx.fillRect(x - 4, y + 7, 3, 5);
  }

  // ---- Rocket / Spaceship ----
  _drawShip(ctx, x, y) {
    // Exhaust flame (flicker)
    const fl = Math.floor(this.phase * 6) % 2;
    ctx.fillStyle = fl ? '#ff7700' : '#ffcc00';
    ctx.fillRect(x - 3, y + 13, 6, 5 + fl * 2);
    ctx.fillStyle = fl ? '#ffcc00' : '#ff4400';
    ctx.fillRect(x - 1, y + 16, 2, 3 + fl);
    // Body
    ctx.fillStyle = '#ccccdd'; ctx.fillRect(x - 6, y - 13, 12, 26);
    // Nose
    ctx.fillStyle = '#ff4444'; ctx.fillRect(x - 5, y - 18, 10, 6);
    ctx.fillRect(x - 3, y - 21, 6, 4);
    ctx.fillRect(x - 1, y - 23, 2, 3);
    // Side fins
    ctx.fillStyle = '#8888aa';
    ctx.fillRect(x - 11, y + 7, 6, 9);
    ctx.fillRect(x + 5,  y + 7, 6, 9);
    // Porthole
    ctx.fillStyle = '#44aaff'; ctx.fillRect(x - 3, y - 6, 6, 6);
    ctx.fillStyle = '#88ddff'; ctx.fillRect(x - 2, y - 5, 2, 2);
    // Panel lines
    ctx.fillStyle = '#aaaacc';
    ctx.fillRect(x - 6, y,     12, 1);
    ctx.fillRect(x - 6, y + 5, 12, 1);
  }

  // ---- UFO ----
  _drawUfo(ctx, x, y) {
    const b = Math.round(Math.sin(this.phase * 3) * 2);
    const uy = y + b;
    // Tractor beam
    ctx.fillStyle = 'rgba(140,220,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(x - 9, uy + 8);
    ctx.lineTo(x + 9, uy + 8);
    ctx.lineTo(x + 18, uy + 34);
    ctx.lineTo(x - 18, uy + 34);
    ctx.closePath();
    ctx.fill();
    // Saucer hull
    ctx.fillStyle = '#778899'; ctx.fillRect(x - 20, uy, 40, 9);
    ctx.fillStyle = '#8899aa'; ctx.fillRect(x - 18, uy + 1, 36, 7);
    // Dome
    ctx.fillStyle = '#ddeeff'; ctx.fillRect(x - 12, uy - 9, 24, 10);
    ctx.fillRect(x - 8,  uy - 13, 16, 5);
    ctx.fillRect(x - 4,  uy - 15, 8,  3);
    // Dome shine
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x - 6, uy - 11, 4, 3);
    // Spinning rim lights
    const lc = ['#ff4444','#44ff88','#4488ff','#ffee44','#ff44ff'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = lc[(i + Math.floor(this.phase * 4)) % lc.length];
      ctx.fillRect(x - 16 + i * 8, uy + 2, 6, 4);
    }
  }
}

// ---- DagashiItem ---------------------------------------------------------
// Sits on top of the bolt. Collected when the player lands on that bolt.

const DAGASHI_TYPES = [
  { name: 'うまか棒', color: '#ffaa00', stripe: '#ff6600' },
  { name: 'ラムネ',   color: '#44aaff', stripe: '#0066cc' },
  { name: 'べべスター', color: '#ff4488', stripe: '#cc0044' },
  { name: 'ふがし',   color: '#88cc44', stripe: '#446600' },
  { name: 'コーラ飴',  color: '#aa6622', stripe: '#662200' },
];

class DagashiItem {
  constructor(boltIndex, boltWorldX, boltWorldY) {
    this.boltIndex = boltIndex;
    this.worldX    = boltWorldX;
    this.worldY    = boltWorldY; // same world-Y reference as the bolt
    this.type      = DAGASHI_TYPES[Math.floor(Math.random() * DAGASHI_TYPES.length)];
    this.collected = false;
    this.bobPhase  = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.bobPhase += dt * 0.003;
  }

  draw(ctx, screenY) {
    if (this.collected) return;
    const x   = Math.round(this.worldX);
    const bob = Math.round(Math.sin(this.bobPhase) * 2);
    const y   = screenY - 14 + bob; // float a little above the bolt top

    const t = this.type;
    // Item body (small box)
    ctx.fillStyle = t.color;
    ctx.fillRect(x - 6, y - 8, 12, 10);
    // Stripe
    ctx.fillStyle = t.stripe;
    ctx.fillRect(x - 6, y - 8, 12, 3);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(x - 4, y - 7, 3, 2);
    // Sparkle star above
    ctx.fillStyle = '#ffff44';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('★', x, y - 10);
  }
}

// ---- ObstacleManager -----------------------------------------------------

class ObstacleManager {
  constructor() {
    this.dagashi  = [];
    this.entities = [];
  }

  reset() {
    this.dagashi  = [];
    this.entities = [];
  }

  // Called each time a new bolt is generated; maybe attach a dagashi item.
  onBoltGenerated(bolt, heightM) {
    if (bolt.index < 4) return; // spare the first few bolts
    // Chance increases slightly with height
    const chance = 0.13 + Math.min(0.10, heightM / 2000);
    if (Math.random() < chance) {
      this.dagashi.push(
        new DagashiItem(bolt.index, bolt.worldX, bolt.worldY)
      );
    }
  }

  // Spawn a flying entity appropriate for the current altitude.
  trySpawnEntity(worldY, heightM, boltIndex) {
    if (boltIndex < 3) return;
    if (this.entities.length >= 3) return; // cap on-screen count
    if (Math.random() > 0.55) return;

    let type;
    if      (heightM < 50)  type = 'bird';
    else if (heightM < 100) type = 'ptero';
    else if (heightM < 200) type = 'plane';
    else if (heightM < 350) type = 'ship';
    else                    type = 'ufo';

    const yOff     = (Math.random() - 0.5) * BOLT_SPACING * 2.5;
    const fromLeft = Math.random() < 0.5;
    this.entities.push(new FlyingEntity(type, fromLeft, worldY + yOff));
  }

  update(dt) {
    for (const d of this.dagashi)  d.update(dt);
    for (const e of this.entities) e.update(dt);
    this.entities = this.entities.filter(e => e.active);
  }

  // Return an uncollected dagashi item sitting on bolt `boltIndex`, or null.
  getDagashiAt(boltIndex) {
    return this.dagashi.find(d => d.boltIndex === boltIndex && !d.collected) || null;
  }

  drawEntities(ctx, worldToScreenY) {
    for (const e of this.entities) {
      if (!e.active) continue;
      const sy = worldToScreenY(e.worldY);
      if (sy < -90 || sy > CANVAS_H + 90) continue;
      e.draw(ctx, sy);
    }
  }

  drawDagashi(ctx, worldToScreenY) {
    for (const d of this.dagashi) {
      if (d.collected) continue;
      const sy = worldToScreenY(d.worldY);
      if (sy < -40 || sy > CANVAS_H + 40) continue;
      d.draw(ctx, sy);
    }
  }
}
