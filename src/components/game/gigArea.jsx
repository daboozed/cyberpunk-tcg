import React, { useEffect, useRef, useState } from "react";

export default function GigArea({
  gigs = [],
  title = "GIGS",
  clickable = false,
  attackGlow = false,
  isOpponent = false,
  onGigClick
}) {
  const prevGigsRef = useRef([]);
  const [boostedIds, setBoostedIds] = useState([]);
  const [newIds, setNewIds] = useState([]);

  useEffect(() => {
    const prev = prevGigsRef.current;

    const boosted = [];
    const added = [];

    gigs.forEach(gig => {
      const oldGig = prev.find(p => p.id === gig.id);

      // New gig entered area
      if (!oldGig) {
        added.push(gig.id);
      }

      // Gig value increased
      if (
        oldGig &&
        typeof oldGig.value === "number" &&
        typeof gig.value === "number" &&
        gig.value > oldGig.value
      ) {
        boosted.push(gig.id);
      }
    });

    if (boosted.length) {
      setBoostedIds(boosted);
      setTimeout(() => setBoostedIds([]), 400);
    }

    if (added.length) {
      setNewIds(added);
      setTimeout(() => setNewIds([]), 600);
    }

    prevGigsRef.current = gigs.map(g => ({ ...g }));
  }, [gigs]);

  return (
    <div
      className="border-2 
                border-dashed 
                border-amber-300
                shadow-[0_0_12px_rgba(253,224,71,.55)]
                rounded-lg px-2 p-1 min-h-[58px] max-w-fit mx-auto"
    >
      <div className="text-xs text-amber-300 mb-1">{title}</div>

      <div
                className="flex gap-2 flex-wrap"
  style={{
                     position: "relative",
                    top: "0px",     // move up/down
                    left: "8px",    // move left/right
  }}
>
        {gigs.map((gig, i) => {
          const boosted = boostedIds.includes(gig.id);
          const added = newIds.includes(gig.id);

          return (
            <button
              key={gig.id || i}
              type="button"
              onClick={() => onGigClick?.(i)}
              className="w-9 h-9 border border-white bg-black text-white rounded text-lg transition-all duration-300"
              style={{
                cursor: clickable ? "pointer" : "default",
                opacity: gig.value ? 1 : 0.5,
                transform: boosted ? "scale(1.18)" : "scale(1)",
                boxShadow: added
                ? "0 0 14px rgba(34,211,238,.95)"
                : boosted
                ? "0 0 12px rgba(34,211,238,.75)"
                : attackGlow && clickable
                ? "0 0 0 3px rgba(255,0,0,0.95), 0 0 14px rgba(255,0,0,1), 0 0 30px rgba(255,0,0,0.95)"
                : "none"
              }}
            >
              {gig.value ?? `d${gig.sides}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}