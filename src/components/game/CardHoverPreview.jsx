import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function CardHoverPreview({ card, mousePos }) {
  if (!card || !card.imageUrl) return null;

  const x = mousePos.x + 16;
  const y = mousePos.y - 320;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left: x, top: Math.max(8, y) }}
    >
      <div className="w-56 h-80 rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover"
        />
      </div>
    </div>,
    document.body
  );
}