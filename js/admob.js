// AdMob integration via @capacitor-community/admob
// Interstitial ad shown on game over when player reached 400m+

const INTERSTITIAL_AD_ID = 'ca-app-pub-2054790971615092/4194358157';
const AD_HEIGHT_THRESHOLD = 400; // meters

const AdMobManager = (() => {
  let initialized = false;
  let adLoaded = false;
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

  // Call with the player's final height in meters
  async function showOnGameOver(heightM) {
    if (!initialized || !adLoaded) return;
    if (heightM < AD_HEIGHT_THRESHOLD) return;

    try {
      adLoaded = false;
      await AdMobPlugin.showInterstitial();
    } catch (e) {
      console.warn('AdMob show failed:', e);
    } finally {
      _loadInterstitial();
    }
  }

  return { init, showOnGameOver };
})();
