import { createPortal } from "react-dom";
import { X, Crown, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALPHA_KIT_ARASAKA = {
  id: 'alpha_arasaka',
  name: 'Alpha Kit — Arasaka',
  faction: 'Arasaka',
  color: 'text-red-400',
  border: 'border-red-500/40',
  bg: 'bg-red-500/5',
  hover: 'hover:bg-red-500/10',
  img: 'https://exburst.dev/cyberpunk/cards/hd/69675c6c8b5e9ad6eb87a33d_a001.webp',
  description: 'Corporate power. Arasaka units dominate the field.',
  legends: ['l0', 'l4', 'l3'],
  mainDeck: [
    { id: 'g1', count: 3 }, { id: 'g5', count: 2 }, { id: 'g2', count: 2 },
    { id: 'p3', count: 3 }, { id: 'p7', count: 3 },
    { id: 'u2', count: 3 }, { id: 'u5', count: 2 }, { id: 'u1', count: 3 },
    { id: 'u8', count: 3 }, { id: 'u9', count: 2 }, { id: 'u6', count: 1 },
  ],
};

const ALPHA_KIT_MERC = {
  id: 'alpha_merc',
  name: 'Alpha Kit — Merc',
  faction: 'Merc',
  color: 'text-blue-400',
  border: 'border-blue-500/40',
  bg: 'bg-blue-500/5',
  hover: 'hover:bg-blue-500/10',
  img: 'https://exburst.dev/cyberpunk/cards/hd/696fb4431860bf853822a945_a002.webp',
  description: 'Street-level operatives. Flexibility and speed.',
  legends: ['l11', 'l12', 'l7'],
  mainDeck: [
    { id: 'g3', count: 3 }, { id: 'g4', count: 2 }, { id: 'g6', count: 2 },
    { id: 'p2', count: 3 }, { id: 'p1', count: 3 },
    { id: 'u10', count: 3 }, { id: 'u15', count: 2 }, { id: 'u16', count: 3 },
    { id: 'u3', count: 3 }, { id: 'u7', count: 2 }, { id: 'u4', count: 1 },
  ],
};

const ALPHA_DECKS = [ALPHA_KIT_ARASAKA, ALPHA_KIT_MERC];

export default function AlphaDecksModal({ onClose, onSelect }) {
  const handleSelect = (deck) => {
    localStorage.setItem('cpTCG_deck', JSON.stringify(deck));
    onSelect?.(deck);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="font-orbitron text-base font-bold text-amber-400 tracking-wider">ALPHA DECKS</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm font-rajdhani text-muted-foreground">Pre-built starter decks. Select one to load and play.</p>

          {ALPHA_DECKS.map(deck => (
            <div
              key={deck.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 ${deck.border} ${deck.bg} ${deck.hover} cursor-pointer transition-all group`}
              onClick={() => handleSelect(deck)}
            >
              <div className="w-16 h-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                <img src={deck.img} alt={deck.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-orbitron font-bold text-sm ${deck.color}`}>{deck.name}</p>
                <p className="font-rajdhani text-xs text-muted-foreground mt-0.5">{deck.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono text-muted-foreground/50">3 Legends · 27 Cards</span>
                </div>
              </div>
              <Swords className={`w-5 h-5 ${deck.color} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}