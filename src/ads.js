// --- Google AdSense configuration -----------------------------------------
// 1. Sign up and get approved at https://www.google.com/adsense
// 2. Replace ADSENSE_CLIENT below with your publisher ID (also update the
//    <script> tag in index.html — both must match).
// 3. Create one ad unit per placement in the AdSense dashboard and paste
//    their slot IDs into AD_SLOTS.
// Until a real client ID is set, ads render as labeled placeholder boxes
// instead of live ad requests.
export const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";

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
