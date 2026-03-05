'use strict';

class Player {
  constructor() {
    this.w = 16;
    this.h = 20;
    this.reset();
  }

  reset() {
    this.worldX = 0;
    this.worldY = 0;
    this.facingRight = true;

    // Jump state
    this.jumping     = false;
    this.jumpFrom    = { x: 0, y: 0 };
    this.jumpTo      = { x: 0, y: 0 };
    this.jumpElapsed = 0;
    this.jumpDuration = 220; // ms

    // Slide / fall state
    this.sliding = false;
    this.slideVy = 0; // world-px per second (downward = negative worldY)
  }

  startJump(fromX, fromY, toX, toY) {
    this.jumping      = true;
    this.jumpElapsed  = 0;
    this.jumpFrom     = { x: fromX, y: fromY };
    this.jumpTo       = { x: toX,   y: toY   };
    this.facingRight  = toX > fromX;
  }

  startSlide() {
    this.sliding = true;
    this.slideVy = -120; // fall downward (negative = lower worldY)
  }

  update(dt) {
    if (this.jumping) {
      this.jumpElapsed += dt;
      const t = Math.min(this.jumpElapsed / this.jumpDuration, 1);
      // ease in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.worldX = this.jumpFrom.x + (this.jumpTo.x - this.jumpFrom.x) * ease;
      // Arc: peak is midpoint + upward offset in world coords
      const arc    = Math.sin(t * Math.PI) * 28;
      this.worldY  = this.jumpFrom.y + (this.jumpTo.y - this.jumpFrom.y) * ease + arc;

      if (t >= 1) {
        this.jumping = false;
        this.worldX  = this.jumpTo.x;
        this.worldY  = this.jumpTo.y;
      }
    } else if (this.sliding) {
      // Gravity acceleration downward
      this.slideVy -= 600 * (dt / 1000);
      this.worldY  += this.slideVy * (dt / 1000);
    }
  }

  // sx, sy = screen coordinates of player's feet
  draw(ctx, sx, sy) {
    const px = Math.round(sx - this.w / 2);
    const py = Math.round(sy - this.h);

    ctx.save();
    if (!this.facingRight) {
      // Flip horizontally around centre
      ctx.translate(sx, sy - this.h / 2);
      ctx.scale(-1, 1);
      ctx.translate(-sx, -(sy - this.h / 2));
    }

    // --- Head ---
    ctx.fillStyle = '#f5c88a';
    ctx.fillRect(px + 4, py,     8, 8);

    // Hair
    ctx.fillStyle = '#3b1f0a';
    ctx.fillRect(px + 3, py,     9, 3);
    ctx.fillRect(px + 3, py + 3, 1, 2);

    // Eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(px + 5, py + 4, 2, 2);
    ctx.fillRect(px + 9, py + 4, 2, 2);

    // Mouth
    ctx.fillStyle = '#b05030';
    ctx.fillRect(px + 6, py + 7, 4, 1);

    // --- Body (blue shirt) ---
    ctx.fillStyle = '#2255cc';
    ctx.fillRect(px + 3, py + 8, 10, 7);

    // Right arm stretched up (toward pole)
    ctx.fillStyle = '#f5c88a';
    ctx.fillRect(px + 13, py + 7, 2, 5);
    // Left arm
    ctx.fillRect(px + 1,  py + 9, 2, 4);

    // --- Pants ---
    ctx.fillStyle = '#553311';
    ctx.fillRect(px + 3, py + 15, 4, 5);
    ctx.fillRect(px + 9, py + 15, 4, 5);

    // Shoes
    ctx.fillStyle = '#111';
    ctx.fillRect(px + 2, py + 18, 5, 2);
    ctx.fillRect(px + 9, py + 18, 5, 2);

    ctx.restore();
  }
}
