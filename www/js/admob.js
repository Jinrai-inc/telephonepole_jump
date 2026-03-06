// AdMob integration via @capacitor-community/admob
// Interstitial ad shown on game over

const INTERSTITIAL_AD_ID = 'ca-app-pub-2054790971615092/4194358157';

// Minimum games between ads to avoid over-showing
const AD_INTERVAL = 3;

const AdMobManager = (() => {
  let initialized = false;
  let adLoaded = false;
  let gameCount = 0;
  let AdMobPlugin = null;

  async function init() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
    try {
      AdMobPlugin = window.Capacitor.Plugins.AdMob;
      if (!AdMobPlugin) return;

      await AdMobPlugin.initialize({ testingDevices: [], initializeForTesting: false });
      initialized = true;
      _loadInterstitial();
    } catch (e) {
      console.warn('AdMob init failed:', e);
    }
  }

  async function _loadInterstitial() {
    if (!initialized || !AdMobPlugin) return;
    try {
      await AdMobPlugin.prepareInterstitial({ adId: INTERSTITIAL_AD_ID });
      adLoaded = true;
    } catch (e) {
      console.warn('AdMob load failed:', e);
      adLoaded = false;
    }
  }

  async function showOnGameOver() {
    gameCount++;
    if (!initialized || !adLoaded) return;
    if (gameCount % AD_INTERVAL !== 0) return;

    try {
      adLoaded = false;
      await AdMobPlugin.showInterstitial();
    } catch (e) {
      console.warn('AdMob show failed:', e);
    } finally {
      // Preload next ad
      _loadInterstitial();
    }
  }

  return { init, showOnGameOver };
})();
