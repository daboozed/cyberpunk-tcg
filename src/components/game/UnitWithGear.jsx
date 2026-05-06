import { cn } from "@/lib/utils";
import GameCard from "./GameCard";

const CARD_W = 80;
const CARD_H = 112;
const PEEK = 22; // px of each gear card's bottom visible below the previous layer

export default function UnitWithGear({ unit, selected, attackTarget = false, onClick }) {
  const gear = unit.gear || [];
  const totalHeight = CARD_H + gear.length * PEEK;

  return (
    <div
      style={{
        position: 'relative',
        width: CARD_W,
        height: totalHeight,
        transform: unit.spent ? 'rotate(45deg) scale(0.95)' : 'none',
        opacity: unit.spent ? 0.7 : 1,
        transition: 'transform 0.2s ease, filter 0.2s ease',
        transformOrigin: 'center center',
        flexShrink: 0,
        filter: attackTarget
  ? 'drop-shadow(0 0 8px rgba(239,68,68,0.65)) drop-shadow(0 0 14px rgba(239,68,68,0.45))'
  : 'none',
boxShadow: attackTarget
  ? '0 0 0 2px rgba(239,68,68,0.65), 0 0 12px rgba(239,68,68,0.45)'
  : 'none',
borderRadius: attackTarget ? '8px' : undefined,
      }}

    >

      {/* Gear cards — each shows only its bottom PEEK px */}
      {gear.map((g, i) => (
        <div
          key={g.uid || i}
          style={{
            position: 'absolute',
            top: CARD_H + i * PEEK,
            left: 0,
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