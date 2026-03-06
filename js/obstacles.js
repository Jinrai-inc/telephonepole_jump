'use strict';

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
    this.dagashi = [];
  }

  reset() {
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

  update(dt) {
    for (const d of this.dagashi) d.update(dt);
  }

  // Return an uncollected dagashi item sitting on bolt `boltIndex`, or null.
  getDagashiAt(boltIndex) {
    return this.dagashi.find(d => d.boltIndex === boltIndex && !d.collected) || null;
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
