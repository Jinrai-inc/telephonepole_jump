'use strict';

// ---- Firebase config --------------------------------------------------------
// Fill in your Firebase project details here to enable online ranking.
// Leave as-is to use local-only mode (scores stored in localStorage).
const FIREBASE_CONFIG = {
  apiKey:            '',
  authDomain:        '',
  databaseURL:       '',
  projectId:         '',
  storageBucket:     '',
  messagingSenderId: '',
  appId:             '',
};

const FIREBASE_ENABLED =
  FIREBASE_CONFIG.databaseURL !== '' &&
  typeof firebase !== 'undefined';

const LOCAL_KEY_SCORES = 'tpj_scores';
const LOCAL_KEY_NICK   = 'tpj_nickname';
const MAX_RANK_ENTRIES = 100; // keep locally

// ---- RankingManager -------------------------------------------------------

class RankingManager {
  constructor() {
    this.nickname  = localStorage.getItem(LOCAL_KEY_NICK) || '';
    this._db       = null;
    this._cache    = []; // cached top-10 for display
    this._fetching = false;

    if (FIREBASE_ENABLED) {
      try {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        this._db = firebase.database();
      } catch (e) {
        console.warn('Firebase init failed, using local fallback:', e);
      }
    }
  }

  // Returns true if a nickname has been set
  hasNickname() { return this.nickname.trim().length > 0; }

  setNickname(nick) {
    this.nickname = nick.trim().slice(0, 12) || 'ゲスト';
    localStorage.setItem(LOCAL_KEY_NICK, this.nickname);
  }

  // Submit a score entry
  submitScore(heightM, score, charId) {
    if (!this.hasNickname()) return;
    const entry = {
      nick:  this.nickname,
      score,
      height: heightM,
      char:  charId,
      date:  Date.now(),
    };

    // Always save locally
    this._saveLocal(entry);

    // Submit to Firebase if available
    if (this._db) {
      this._db.ref('scores').push(entry).catch(() => {});
    }
  }

  _saveLocal(entry) {
    let scores = this._loadLocal();
    scores.push(entry);
    scores.sort((a, b) => b.height - a.height);
    scores = scores.slice(0, MAX_RANK_ENTRIES);
    localStorage.setItem(LOCAL_KEY_SCORES, JSON.stringify(scores));
  }

  _loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY_SCORES) || '[]');
    } catch { return []; }
  }

  // Fetch top-10, calls callback(entries) where entries = [{rank,nick,height,score,char}]
  fetchTop10(callback) {
    if (this._db) {
      this._db.ref('scores')
        .orderByChild('height')
        .limitToLast(10)
        .once('value')
        .then(snap => {
          const entries = [];
          snap.forEach(child => entries.push(child.val()));
          entries.sort((a, b) => b.height - a.height);
          this._cache = entries.map((e, i) => ({ rank: i+1, ...e }));
          callback(this._cache);
        })
        .catch(() => callback(this._localTop10()));
    } else {
      // Slight delay to feel async
      setTimeout(() => callback(this._localTop10()), 100);
    }
  }

  _localTop10() {
    return this._loadLocal()
      .slice(0, 10)
      .map((e, i) => ({ rank: i + 1, ...e }));
  }

  // Returns the player's local best rank, or null
  myRank(heightM) {
    const all = this._loadLocal();
    const idx = all.findIndex(e => e.height <= heightM);
    return idx === -1 ? all.length + 1 : idx + 1;
  }
}

const ranking = new RankingManager();
