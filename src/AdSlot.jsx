import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADS_ENABLED } from "./ads.js";

export default function AdSlot({ slot, format = "auto", style, minHeight = 90 }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet (e.g. blocked by an ad blocker) — ignore.
    }
  }, []);

  return (
    <div style={{ textAlign: "center", ...style }}>
      <div style={{ fontSize: 8, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
        Advertisement
      </div>
      {ADS_ENABLED ? (
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
          Ad slot (configure AdSense in src/ads.js)
        </div>
      )}
    </div>
  );
}
