import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADS_ENABLED } from "./ads.js";

// Placeholder slot IDs are all-digit strings of zeros (see src/ads.js AD_SLOTS).
const isPlaceholderSlot = (slot) => /^0+$/.test(slot);

export default function AdSlot({ slot, format = "auto", style, minHeight = 90 }) {
  const live = ADS_ENABLED && !isPlaceholderSlot(slot);
  const pushed = useRef(false);

  useEffect(() => {
    if (!live || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet (e.g. blocked by an ad blocker) — ignore.
    }
  }, [live]);

  return (
    <div style={{ textAlign: "center", ...style }}>
      <div style={{ fontSize: 8, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
        Advertisement
      </div>
      {live ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div
          style={{
            minHeight, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, border: "1px dashed #ffffff20", color: "#64748b", fontSize: 11,
          }}
        >
          Ad slot (add a real slot ID in src/ads.js)
        </div>
      )}
    </div>
  );
}
