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

    // Jump
    this.jumping      = false;
    this.jumpFrom     = { x: 0, y: 0 };
    this.jumpTo       = { x: 0, y: 0 };
    this.jumpElapsed  = 0;
    this.jumpDuration = 210; // ms

    // Slide / fall
    this.sliding  = false;
    this.slideVy  = 0;

    // Animation
    this.idlePhase  = 0;   // 0..1 for bob cycle
    this.animState  = 'idle'; // 'idle' | 'jump' | 'slide'
    this.landSquash = 0;   // countdown ms for landing squash
  }

  startJump(fromX, fromY, toX, toY) {
    this.jumping     = true;
    this.jumpElapsed = 0;
    this.jumpFrom    = { x: fromX, y: fromY };
    this.jumpTo      = { x: toX,   y: toY   };
    this.facingRight = toX > fromX;
    this.animState   = 'jump';
    sound.jump();
  }

  startSlide() {
    this.sliding   = true;
    this.slideVy   = -100;
    this.animState = 'slide';
  }

  update(dt) {
    if (this.jumping) {
      this.jumpElapsed += dt;
      const t    = Math.min(this.jumpElapsed / this.jumpDuration, 1);
      const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
      this.worldX = this.jumpFrom.x + (this.jumpTo.x - this.jumpFrom.x) * ease;
      const arc   = Math.sin(t * Math.PI) * 30;
      this.worldY = this.jumpFrom.y + (this.jumpTo.y - this.jumpFrom.y) * ease + arc;

      if (t >= 1) {
        this.jumping   = false;
        this.worldX    = this.jumpTo.x;
        this.worldY    = this.jumpTo.y;
        this.animState = 'idle';
        this.landSquash = 80;
        sound.land();
      }
    } else if (this.sliding) {
      this.slideVy -= 700 * (dt / 1000);
      this.worldY  += this.slideVy * (dt / 1000);
    } else {
      // Idle bob
      this.idlePhase += dt * 0.0015;
    }

    if (this.landSquash > 0) {
      this.landSquash -= dt;
    }
  }

  draw(ctx, sx, sy) {
    // Squash on landing
    let scaleY = 1, scaleX = 1;
    if (this.landSquash > 0) {
      const t  = this.landSquash / 80;
      scaleY   = 1 - t * 0.25;
      scaleX   = 1 + t * 0.15;
    }

    ctx.save();
    if (scaleY !== 1) {
      ctx.translate(sx, sy);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-sx, -sy);
    }

    charRenderer.draw(
      ctx,
      charManager.selected,
      sx, sy,
      this.facingRight,
      this.idlePhase,
      this.animState
    );

    ctx.restore();
  }
}
