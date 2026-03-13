'use strict';

// Game Center leaderboard ID - must match App Store Connect configuration
const GAME_CENTER_LEADERBOARD_ID = 'com.jinraiinc.telephonepolejump.endless';

const GameCenterManager = (() => {
  let _authenticated = false;

  function _plugin() {
    return window.Capacitor?.Plugins?.GameCenter;
  }

  async function init() {
    const plugin = _plugin();
    if (!plugin) return;
    try {
      const result = await plugin.signIn();
      _authenticated = result?.isAuthenticated === true;
    } catch (e) {
      console.warn('Game Center sign in failed:', e);
    }
  }

  async function submitScore(heightM) {
    if (!_authenticated) return;
    const plugin = _plugin();
    if (!plugin) return;
    try {
      // Submit height in centimetres as an integer for leaderboard precision
      const score = Math.round(heightM * 100);
      await plugin.submitScore({ leaderboardID: GAME_CENTER_LEADERBOARD_ID, score });
    } catch (e) {
      console.warn('Game Center submit score failed:', e);
    }
  }

  // Returns true if the native leaderboard UI was shown
  async function showLeaderboard() {
    const plugin = _plugin();
    if (!plugin) return false;
    try {
      const result = await plugin.showLeaderboard({ leaderboardID: GAME_CENTER_LEADERBOARD_ID });
      return result?.shown === true;
    } catch (e) {
      console.warn('Game Center show leaderboard failed:', e);
      return false;
    }
  }

  return {
    init,
    submitScore,
    showLeaderboard,
    get isAuthenticated() { return _authenticated; },
  };
})();
