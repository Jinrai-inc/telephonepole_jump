'use strict';

// ---- Firebase config --------------------------------------------------------
// Fill in your Firebase project details here to enable online ranking.
// Leave as-is to use local-only mode (scores stored in localStorage).
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyC6KSz938V6qnCGKE0Uverkj8p5k6z89rE',
  authDomain:        'telephonepolejump.firebaseapp.com',
  databaseURL:       'https://telephonepolejump-default-rtdb.firebaseio.com',
  projectId:         'telephonepolejump',
  storageBucket:     'telephonepolejump.firebasestorage.app',
  messagingSenderId: '1006769112628',
  appId:             '1:1006769112628:web:bffa07dc1f94e5a1fc6c61',
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
    scores = this._dedupByNick(scores);
    scores = scores.slice(0, MAX_RANK_ENTRIES);
    localStorage.setItem(LOCAL_KEY_SCORES, JSON.stringify(scores));
  }

  _loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY_SCORES) || '[]');
    } catch { return []; }
  }

  // Keep only the best entry per nickname, sorted by height desc
  _dedupByNick(scores) {
    const best = new Map();
    for (const s of scores) {
      if (!best.has(s.nick) || s.height > best.get(s.nick).height) {
        best.set(s.nick, s);
      }
    }
    return Array.from(best.values()).sort((a, b) => b.height - a.height);
  }

  // Fetch top-10, calls callback(entries) where entries = [{rank,nick,height,score,char}]
  fetchTop10(callback) {
    if (this._db) {
      let done = false;
      const finish = (entries) => {
        if (done) return;
        done = true;
        callback(entries);
      };
      // Fallback to local data if Firebase doesn't respond within 5 seconds
      const timer = setTimeout(() => finish(this._localTop10()), 5000);
      // Fetch more entries so dedup still yields a full top-10
      this._db.ref('scores')
        .orderByChild('height')
        .limitToLast(200)
        .once('value')
        .then(snap => {
          clearTimeout(timer);
          const raw = [];
          snap.forEach(child => raw.push(child.val()));
          const entries = this._dedupByNick(raw).slice(0, 10);
          this._cache = entries.map((e, i) => ({ rank: i+1, ...e }));
          finish(this._cache);
        })
        .catch(() => { clearTimeout(timer); finish(this._localTop10()); });
    } else {
      // Slight delay to feel async
      setTimeout(() => callback(this._localTop10()), 100);
    }
  }

  _localTop10() {
    return this._dedupByNick(this._loadLocal())
      .slice(0, 10)
      .map((e, i) => ({ rank: i + 1, ...e }));
  }

  // Returns the player's local best rank, or null
  myRank(heightM) {
    const all = this._dedupByNick(this._loadLocal());
    const idx = all.findIndex(e => e.height <= heightM);
    return idx === -1 ? all.length + 1 : idx + 1;
  }
}

const ranking = new RankingManager();
