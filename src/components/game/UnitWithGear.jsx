import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import GameCard from "./GameCard";

const CARD_W = 80;
const CARD_H = 112;
const PEEK = 22; // px of each gear card's bottom visible below the previous layer

function hasKeyword(card, keyword) {
  const normalizedKeyword = String(keyword || "").toLowerCase();

  if (
    normalizedKeyword === "blocker" &&
    (card?.grantsBlocker === true || card?.effect?.grantsBlocker === true)
  ) {
    return true;
  }

  const keywords = [
    ...(card?.keywords || []),
    ...(card?.effect?.keywords || []),
    ...(card?.effectData?.keywords || []),
    ...(card?.effect?.effect?.keywords || []),
    ...(card?.effectData?.effect?.keywords || []),
  ];

  return keywords
    .map(k => String(k || "").toLowerCase())
    .includes(normalizedKeyword);
}

function getBlockerSource(unit) {
  if (hasKeyword(unit, "blocker")) return "unit";

  const blockerGear = (unit?.gear || []).find(g => hasKeyword(g, "blocker"));
  if (blockerGear) return "gear";

  return null;
}

function getTargetGlowStyles(tone) {
  if (tone === "red") {
    return {
      filter: "drop-shadow(0 0 6px rgba(255,23,68,0.8)) drop-shadow(0 0 15px rgba(255,23,68,0.52))",
      boxShadow: "0 0 0 2px rgba(255,23,68,0.86), 0 0 14px rgba(255,23,68,0.62), 0 0 24px rgba(255,23,68,0.36)",
    };
  }

  if (tone === "blue") {
    return {
      filter: "drop-shadow(0 0 6px rgba(0,191,255,0.75)) drop-shadow(0 0 14px rgba(0,191,255,0.48))",
      boxShadow: "0 0 0 2px rgba(0,191,255,0.82), 0 0 14px rgba(0,191,255,0.58), 0 0 24px rgba(0,191,255,0.32)",
    };
  }

  return {
    filter: "drop-shadow(0 0 5px rgba(57,255,20,0.48)) drop-shadow(0 0 9px rgba(57,255,20,0.35))",
    boxShadow: "0 0 0 1px rgba(57,255,20,0.48), 0 0 9px rgba(57,255,20,0.43), 0 0 16px rgba(57,255,20,0.23)",
  };
}

export default function UnitWithGear({ unit, selected, attackTarget = false, targetingGlow = false, targetingGlowTone = "green", blockerGlow = false, onClick }) {
  const gear = unit.gear || [];
  const totalHeight = CARD_H + gear.length * PEEK;
  const isTargetHighlighted = targetingGlow;
  const isBlockerHighlighted = blockerGlow && !unit.spent;
  const blockerSource = getBlockerSource(unit);
  const hasBlocker = !!blockerSource;
  const targetGlowStyles = isTargetHighlighted ? getTargetGlowStyles(targetingGlowTone) : null;

  return (
    <div
      style={{
        position: 'relative',
        width: CARD_W,
        height: totalHeight,
        transform: unit.spent ? 'rotate(45deg) scale(0.95)' : 'none',
        opacity: unit.spent ? 0.7 : 1,
        cursor: isTargetHighlighted || isBlockerHighlighted ? 'crosshair' : undefined,
        transition: 'transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease',
        transformOrigin: 'center center',
        flexShrink: 0,
        filter: isBlockerHighlighted
          ? 'drop-shadow(0 0 5px rgba(156,163,175,0.65)) drop-shadow(0 0 10px rgba(156,163,175,0.45))'
          : isTargetHighlighted
            ? targetGlowStyles.filter
            : attackTarget
              ? 'drop-shadow(0 0 8px rgba(239,68,68,0.65)) drop-shadow(0 0 14px rgba(239,68,68,0.45))'
              : 'none',
        boxShadow: isBlockerHighlighted
          ? '0 0 0 2px rgba(156,163,175,0.7), 0 0 12px rgba(156,163,175,0.5), 0 0 20px rgba(156,163,175,0.28)'
          : isTargetHighlighted
            ? targetGlowStyles.boxShadow
            : attackTarget
              ? '0 0 0 2px rgba(239,68,68,0.65), 0 0 12px rgba(239,68,68,0.45)'
              : 'none',
        borderRadius: isBlockerHighlighted || isTargetHighlighted || attackTarget ? '8px' : undefined,
      }}

    >

      {/* Gear cards — each shows only its bottom PEEK px */}
      {gear.map((g, i) => (
        <div
          key={g.uid || i}
          style={{
            position: 'absolute',
            top: CARD_H + i * PEEK,
            left: 8,
            width: CARD_W,
            height: PEEK,
            overflow: 'hidden',
            borderRadius: '0 0 6px 6px',
            border: '1px solid rgba(244,63,94,0.5)',
            zIndex: i + 1,
          }}
        >
          {/* Full card image, anchored to bottom so bottom slice shows */}
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: CARD_H }}>
            {g.imageUrl ? (
              <img
                src={g.imageUrl}
                alt={g.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'rgba(80, 10, 20, 0.9)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                paddingBottom: 2,
              }}>
                <span style={{ fontSize: 7, color: '#f87171', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {g.name}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Unit card on top */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H, zIndex: gear.length + 2 }}>
        <GameCard
          card={unit}
          spent={unit.spent}
          selected={selected}
          onClick={onClick}
          showDetails
        />
      </div>

      {/* Blocker badge — bottom-right of unit card. Gear-granted blocker is silver. */}
      {hasBlocker && (
        <div
          title={blockerSource === "gear" ? "Blocker from gear" : "Blocker"}
          style={{
            position: 'absolute',
            top: CARD_H - 30,
            right: 16,
            zIndex: gear.length + 4,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: blockerSource === 'gear' ? '#00ffff' : '#00ffff',
            border: '2px solid hsl(225 30% 6%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 5px rgba(0,0,0,0.75)',
            opacity: unit.spent ? 0.65 : 1,
          }}
        >
          <Shield
  size={45}
  strokeWidth={3}
  color="#000000"
/>
        </div>
      )}

      {/* Gear count badge — bottom-right of unit card, outside the card edge */}
      {gear.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: gear.length * PEEK,
            right: -20,
            transform: 'translateY(50%)',
            zIndex: gear.length + 3,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#facc15',
            border: '2px solid hsl(225 30% 6%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-orbitron)', fontWeight: 900, fontSize: 9, color: '#000', lineHeight: 1 }}>
            {gear.length}
          </span>
        </div>
      )}
    </div>
  );
}
