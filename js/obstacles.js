'use strict';

// ---- Crow ----------------------------------------------------------------
// The crow flies horizontally across the screen at a fixed world-Y height.
// At the moment of a jump, if the crow is on the same side as the target
// bolt, the timer is penalised by 0.3 s.
// Note: CANVAS_W, BOLT_SPACING are global consts defined in game.js (loaded later,
//       but these classes are only instantiated at runtime, so the values are
//       already available by then).

class Crow {
  constructor(fromSide, worldY) {
    this.fromSide = fromSide; // side the crow enters from
    this.worldY   = worldY;
    this.active   = true;

    const speed = 80 + Math.random() * 50; // px / s
    if (fromSide === 'left') {
      this.x  = -36;
      this.vx = speed;
    } else {
      this.x  = CANVAS_W + 36;
      this.vx = -speed;
    }

    this.wingPhase = Math.random() * Math.PI * 2;
  }

  // Which side of the pole is the crow currently on?
  get side() {
    return this.x < CANVAS_W / 2 ? 'left' : 'right';
  }

  update(dt) {
    this.x         += this.vx * (dt / 1000);
    this.wingPhase += dt * 0.009;
    // Deactivate once fully off the opposite edge
    if (this.vx > 0 && this.x > CANVAS_W + 50) this.active = false;
    if (this.vx < 0 && this.x < -50)            this.active = false;
  }

  draw(ctx, screenY) {
    if (!this.active) return;
    const x = Math.round(this.x);
    const y = Math.round(screenY);
    const wing = Math.round(Math.sin(this.wingPhase * 8) * 4);

    ctx.save();
    // Flip when flying left-to-right so beak always points forward
    if (this.vx > 0) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }

    // Body
    ctx.fillStyle = '#111111';
    ctx.fillRect(x - 9, y - 5, 18, 8);
    // Head
    ctx.fillRect(x + 7, y - 10, 6, 6);
    // Beak
    ctx.fillStyle = '#ddaa00';
    ctx.fillRect(x + 13, y - 8, 5, 2);
    // Eye
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(x + 9, y - 9, 2, 2);
    // Wings (flapping)
    ctx.fillStyle = '#222222';
    ctx.fillRect(x - 16, y - 5 - wing, 9, 4);
    ctx.fillRect(x + 7,  y - 5 - wing, 9, 4);
    // Feet
    ctx.fillStyle = '#888888';
    ctx.fillRect(x - 2, y + 3, 2, 4);
    ctx.fillRect(x + 2, y + 3, 2, 4);

    ctx.restore();
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
    this.crows   = [];
    this.dagashi = [];
  }

  reset() {
    this.crows   = [];
    this.dagashi = [];
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

  // Called when player LANDS on a bolt; maybe spawn a crow at that level.
  trySpawnCrow(worldY, heightM, boltIndex) {
    if (heightM < 20 || boltIndex < 4) return;
    // Probability increases with height
    const chance = Math.min(0.75,
      0.25 + (heightM - 20) / 500
    );
    if (Math.random() > chance) return;
    const fromSide = Math.random() < 0.5 ? 'left' : 'right';
    this.crows.push(new Crow(fromSide, worldY));
  }

  update(dt) {
    for (const c of this.crows)   c.update(dt);
    for (const d of this.dagashi) d.update(dt);
    this.crows = this.crows.filter(c => c.active);
  }

  // Is there an active crow on `side` at the height band of `worldY`?
  crowOnSide(side, worldY) {
    const band = BOLT_SPACING * 1.2;
    return this.crows.some(c =>
      c.active &&
      Math.abs(c.worldY - worldY) < band &&
      c.side === side
    );
  }

  // Return an uncollected dagashi item sitting on bolt `boltIndex`, or null.
  getDagashiAt(boltIndex) {
    return this.dagashi.find(d => d.boltIndex === boltIndex && !d.collected) || null;
  }

  drawCrows(ctx, worldToScreenY) {
    for (const c of this.crows) {
      if (!c.active) continue;
      const sy = worldToScreenY(c.worldY) - 22;
      if (sy < -40 || sy > CANVAS_H + 40) continue;
      c.draw(ctx, sy);
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
