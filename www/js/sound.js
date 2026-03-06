'use strict';

class SoundManager {
  constructor() {
    this._ac      = null;
    this.enabled  = true; // toggled by player
    this._bgmLoop = null;
    this._bgmGain = null;
    this._bgmStep = 0;
    this._bgmRunning = false;
  }

  // Lazily create AudioContext (must happen after user gesture)
  _ctx() {
    if (!this._ac) {
      try {
        this._ac = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    if (this._ac.state === 'suspended') this._ac.resume();
    return this._ac;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this._stopBGM();
  }

  // ---- Low-level tone helper ----
  _tone(freq, startSec, dur, type = 'square', vol = 0.12, slide = null) {
    if (!this.enabled) return;
    const ac = this._ctx();
    if (!ac) return;
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startSec);
    if (slide) osc.frequency.linearRampToValueAtTime(slide, startSec + dur);
    gain.gain.setValueAtTime(vol, startSec);
    gain.gain.exponentialRampToValueAtTime(0.0001, startSec + dur);
    osc.start(startSec);
    osc.stop(startSec + dur + 0.01);
  }

  // ---- SFX ----
  jump() {
    const ac = this._ctx(); if (!ac) return;
    const t = ac.currentTime;
    this._tone(330, t,        0.05, 'square',   0.10);
    this._tone(440, t + 0.04, 0.07, 'square',   0.12, 660);
  }

  land() {
    const ac = this._ctx(); if (!ac) return;
    const t = ac.currentTime;
    this._tone(180, t, 0.06, 'sawtooth', 0.10, 80);
  }

  crowPenalty() {
    const ac = this._ctx(); if (!ac) return;
    const t = ac.currentTime;
    this._tone(120, t,        0.10, 'sawtooth', 0.18);
    this._tone(90,  t + 0.08, 0.12, 'sawtooth', 0.14);
  }

  dagashiGet() {
    const ac = this._ctx(); if (!ac) return;
    const t  = ac.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this._tone(f, t + i * 0.07, 0.09, 'square', 0.13));
  }

  combo(level) {
    // level: 1=x5, 2=x10, 3=x20+
    const ac = this._ctx(); if (!ac) return;
    const t  = ac.currentTime;
    if (level === 1) {
      [440, 550, 660].forEach((f, i) => this._tone(f, t + i * 0.06, 0.07, 'square', 0.11));
    } else if (level >= 2) {
      [440, 550, 660, 880].forEach((f, i) => this._tone(f, t + i * 0.055, 0.07, 'square', 0.13));
    }
  }

  gameOver() {
    const ac = this._ctx(); if (!ac) return;
    const t  = ac.currentTime;
    [392, 330, 262, 196, 131].forEach((f, i) =>
      this._tone(f, t + i * 0.13, 0.15, 'sawtooth', 0.16)
    );
  }

  newRecord() {
    const ac = this._ctx(); if (!ac) return;
    const t  = ac.currentTime;
    [523, 659, 784, 659, 784, 1047].forEach((f, i) =>
      this._tone(f, t + i * 0.09, 0.10, 'square', 0.12)
    );
  }

  menuSelect() {
    const ac = this._ctx(); if (!ac) return;
    this._tone(660, ac.currentTime, 0.06, 'square', 0.09);
  }

  unlock() {
    const ac = this._ctx(); if (!ac) return;
    const t  = ac.currentTime;
    [330, 440, 550, 440, 660, 880].forEach((f, i) =>
      this._tone(f, t + i * 0.08, 0.09, 'square', 0.14)
    );
  }

  // ---- BGM ----
  // Pentatonic-ish 8-bit loop; two tracks: melody + bass
  startBGM() {
    if (this._bgmRunning) return;
    this._bgmRunning = true;
    this._bgmStep    = 0;
    this._scheduleBGM();
  }

  _stopBGM() {
    this._bgmRunning = false;
    clearTimeout(this._bgmTimer);
  }

  stopBGM() { this._stopBGM(); }

  _scheduleBGM() {
    if (!this._bgmRunning || !this.enabled) return;
    const ac  = this._ctx(); if (!ac) { this._bgmTimer = setTimeout(() => this._scheduleBGM(), 500); return; }
    const BPM = 160;
    const beat = 60 / BPM;          // seconds per beat
    const now  = ac.currentTime;

    // ---- Melody (16-step loop) ----
    // C major pentatonic: C4 D4 E4 G4 A4 C5
    const mel = [
      [262,1],[294,1],[330,1],[392,1],[440,1],[392,1],[330,1],[262,1],
      [294,1],[330,1],[392,1],[330,1],[294,1],[262,1],[392,2],[0,  2]
    ];

    // ---- Bass (8-step loop, 2-beat steps) ----
    const bass = [131,131,147,131,110,131,147,131];

    mel.forEach(([f, len], i) => {
      const t = now + i * beat;
      if (f > 0) this._tone(f, t, beat * len * 0.75, 'square', 0.07);
    });
    bass.forEach((f, i) => {
      const t = now + i * beat * 2;
      this._tone(f, t, beat * 1.6, 'triangle', 0.09);
    });

    // Loop: schedule next iteration at end of 16-beat loop
    const loopLen = mel.reduce((s, [, l]) => s + l, 0);
    this._bgmTimer = setTimeout(() => this._scheduleBGM(), loopLen * beat * 1000 - 50);
  }
}

// Singleton
const sound = new SoundManager();
