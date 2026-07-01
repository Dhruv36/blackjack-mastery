// --- Google AdSense configuration -----------------------------------------
// Publisher ID (must match the <script> tag in index.html). Ad unit slot IDs
// below are still placeholders — create one ad unit per placement in the
// AdSense dashboard and paste their real slot IDs into AD_SLOTS.
export const ADSENSE_CLIENT = "ca-pub-2014899451137915";

export const AD_SLOTS = {
  topBanner: "0000000000",
  bottomBanner: "0000000001",
  sidebar: "0000000002",
  interstitial: "0000000003",
};

export const ADS_ENABLED = !ADSENSE_CLIENT.includes("XXXX");

// Show the between-hand interstitial only once every N completed rounds, and
// require a short minimum view before "Continue" unlocks. Keep both values
// reasonable — showing a fresh ad on every single hand (or a near-zero wait)
// reads as inflated/invalid traffic to AdSense and risks the account.
export const INTERSTITIAL_EVERY_HANDS = 5;
export const INTERSTITIAL_MIN_WAIT_SEC = 5;
