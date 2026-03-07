'use strict';

// ---- Theme sequence (10 themes, one per 10-stage tier) ----
const THEME_SEQUENCE = [
  'countryside', // stages  1-10
  'city',        // stages 11-20
  'jungle',      // stages 21-30
  'underwater',  // stages 31-40
  'egypt',       // stages 41-50
  'winter',      // stages 51-60
  'volcano',     // stages 61-70
  'space',       // stages 71-80
  'demonworld',  // stages 81-90
  'heaven',      // stages 91-100
];

// ---- Stage → character unlock mapping (char ids 10-39) ----
const STAGE_UNLOCK_MAP = {
   2: 10,  // カメ
   3: 11,  // パンダ
   5: 12,  // カッパ
   7: 13,  // ウサギ
   9: 14,  // キツネ
  11: 15,  // クマ
  13: 16,  // ペンギン
  15: 17,  // サル
  17: 18,  // ゾウ
  19: 19,  // トラ
  21: 20,  // ドラゴン
  23: 21,  // フェニックス
  25: 22,  // ユニコーン
  27: 23,  // ケルベロス
  29: 24,  // グリフィン
  31: 25,  // ガーゴイル
  33: 26,  // フェアリー
  35: 27,  // ウィザード
  37: 28,  // ナイト
  39: 29,  // サムライ(新)
  41: 30,  // ピレート
  43: 31,  // バイキング
  45: 32,  // ファラオ
  47: 33,  // エンジェル
  49: 34,  // デーモン
  52: 35,  // ロボット
  55: 36,  // エイリアン
  58: 37,  // スペースマン
  61: 38,  // サイボーグ
  70: 39,  // ゴールドドラゴン
};

// ---- Build 100-stage config array ----
// Each stage: clear 30 bolts × stageNum  (stage 1 = bolt 30, stage 100 = bolt 3000)
const STAGES = Array.from({ length: 100 }, (_, i) => {
  const stageNum = i + 1;
  const tier     = Math.floor(i / 10);
  return {
    stageNum,
    timeMax:     parseFloat((2.00 - 0.14 * tier).toFixed(2)),
    theme:       THEME_SEQUENCE[tier],
    unlockCharId: STAGE_UNLOCK_MAP[stageNum] || null,
    boltGoal:    stageNum * 30,
  };
});

// ---- StageManager ----
class StageManager {
  constructor() {
    this.progress      = parseInt(localStorage.getItem('tpj_stage_progress') || '0', 10);
    this.selectedStage = parseInt(localStorage.getItem('tpj_stage_selected') || '1', 10);
    this._unlocked     = JSON.parse(localStorage.getItem('tpj_stage_unlocked_chars') || '[]');
  }

  isCharacterUnlocked(charId) {
    return this._unlocked.includes(charId);
  }

  unlockCharacter(charId) {
    if (!this._unlocked.includes(charId)) {
      this._unlocked.push(charId);
      localStorage.setItem('tpj_stage_unlocked_chars', JSON.stringify(this._unlocked));
    }
  }

  setSelectedStage(n) {
    this.selectedStage = n;
    localStorage.setItem('tpj_stage_selected', n);
  }

  getStageConfig(n) {
    return STAGES[Math.max(0, Math.min(99, n - 1))];
  }

  getThemeForStage(n) {
    return this.getStageConfig(n).theme;
  }

  completeStage(n) {
    if (n > this.progress) {
      this.progress = n;
      localStorage.setItem('tpj_stage_progress', n);
    }
    const cfg = this.getStageConfig(n);
    let newCharUnlocked = null;
    if (cfg.unlockCharId !== null && !this.isCharacterUnlocked(cfg.unlockCharId)) {
      this.unlockCharacter(cfg.unlockCharId);
      newCharUnlocked = cfg.unlockCharId;
    }
    return { newCharUnlocked };
  }

  getProgress() { return this.progress; }

  isStageAvailable(n) { return n <= this.progress + 1; }
}

const stageManager = new StageManager();
