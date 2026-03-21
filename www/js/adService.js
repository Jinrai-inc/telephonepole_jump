// AppLovin MAX mediation service (replaces admob.js)
// Uses cordova-plugin-applovin-max via Capacitor's Cordova bridge
//
// Ad Unit IDs — replace with your real values from AppLovin dashboard:
//   https://dash.applovin.com/o/mediation/ad_units/
const APPLOVIN_SDK_KEY         = 'YOUR_APPLOVIN_SDK_KEY';
const INTERSTITIAL_AD_UNIT_ID  = 'YOUR_INTERSTITIAL_AD_UNIT_ID';
const REWARDED_AD_UNIT_ID      = 'YOUR_REWARDED_AD_UNIT_ID';
const BANNER_AD_UNIT_ID        = 'YOUR_BANNER_AD_UNIT_ID';

const INTERSTITIAL_INTERVAL = 5; // show every N games (spec: 5 battles)

const AdService = (() => {
  let initialized = false;
  let MAX = null;
  let gameCount = 0;
  let pendingRewardCallback = null;

  // ---- Init ----
  function init() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
    MAX = window.AppLovinMAX;
    if (!MAX) return;

    MAX.initialize(APPLOVIN_SDK_KEY, () => {
      initialized = true;
      _setupListeners();
      _loadInterstitial();
      _loadRewardedAd();
    });
  }

  function _setupListeners() {
    MAX.setInterstitialListener({
      onInterstitialLoaded:     () => {},
      onInterstitialLoadFailed: (adUnitId, errorCode, errorMessage) => {
        console.warn('Interstitial load failed:', errorCode, errorMessage);
      },
      onInterstitialDismissed:  () => { _loadInterstitial(); },
    });

    MAX.setRewardedAdListener({
      onRewardedAdLoaded:     () => {},
      onRewardedAdLoadFailed: (adUnitId, errorCode, errorMessage) => {
        console.warn('Rewarded ad load failed:', errorCode, errorMessage);
        // fallback: grant reward without ad
        if (pendingRewardCallback) { pendingRewardCallback(); pendingRewardCallback = null; }
      },
      onRewardedAdReceived:   () => {
        if (pendingRewardCallback) { pendingRewardCallback(); pendingRewardCallback = null; }
      },
      onRewardedAdDismissed:  () => { _loadRewardedAd(); },
    });

    MAX.setBannerListener({
      onBannerAdLoaded:     () => {},
      onBannerAdLoadFailed: (adUnitId, errorCode, errorMessage) => {
        console.warn('Banner load failed:', errorCode, errorMessage);
      },
    });
  }

  // ---- Load helpers ----
  function _loadInterstitial() {
    if (!initialized || !MAX) return;
    MAX.loadInterstitial(INTERSTITIAL_AD_UNIT_ID);
  }

  function _loadRewardedAd() {
    if (!initialized || !MAX) return;
    MAX.loadRewardedAd(REWARDED_AD_UNIT_ID);
  }

  // ---- Public API ----

  // Call at end of each game. Shows interstitial every INTERSTITIAL_INTERVAL games.
  function showInterstitialOnGameOver() {
    gameCount++;
    if (!initialized || !MAX) return;
    if (gameCount % INTERSTITIAL_INTERVAL !== 0) return;
    if (!MAX.isInterstitialReady(INTERSTITIAL_AD_UNIT_ID)) return;
    MAX.showInterstitial(INTERSTITIAL_AD_UNIT_ID);
  }

  // Show rewarded ad; onReward() is called when the user earns the reward.
  // Falls back to granting reward immediately if ad unavailable.
  function showRewardedAd(onReward) {
    if (!initialized || !MAX || !MAX.isRewardedAdReady(REWARDED_AD_UNIT_ID)) {
      onReward();
      return;
    }
    pendingRewardCallback = onReward;
    MAX.showRewardedAd(REWARDED_AD_UNIT_ID);
  }

  // Show native banner anchored to bottom of screen (game over screen)
  function showBanner() {
    if (!initialized || !MAX) return;
    MAX.createBanner(BANNER_AD_UNIT_ID, 'BOTTOM_CENTER');
    MAX.showBanner(BANNER_AD_UNIT_ID);
  }

  // Hide banner when leaving game over screen
  function hideBanner() {
    if (!initialized || !MAX) return;
    MAX.hideBanner(BANNER_AD_UNIT_ID);
  }

  return { init, showInterstitialOnGameOver, showRewardedAd, showBanner, hideBanner };
})();
