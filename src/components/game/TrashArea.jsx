import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GameCard from "./GameCard";

export default function TrashArea({ trash = [], isOpponent = false }) {
  const [showModal, setShowModal] = useState(false);
  const topCard = trash[trash.length - 1];

  return (
    <>
      <div className="mt-2">
        <p className="text-[8px] font-mono mb-1 uppercase tracking-widest" style={{ color: 'rgba(255,80,80,0.7)' }}>Trash ({trash.length})</p>
        {topCard ? (
          <div
            className="relative cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowModal(true)}
            style={{ width: 56 }}
          >
            <GameCard card={topCard} small />
            <div className="absolute inset-0 bg-black/30 rounded-lg pointer-events-none" />
            <span className="absolute top-0.5 right-1 text-white text-[9px] font-bold drop-shadow z-10">{trash.length}</span>
          </div>
        ) : (
          <div className="w-14 h-20 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'rgba(255,80,80,0.5)', background: 'rgba(255,80,80,0.08)' }}>
            <Trash2 className="w-4 h-4" style={{ color: 'rgba(255,80,80,0.4)' }} />
          </div>
        )}
      </div>

      {showModal && (
        <TrashModal trash={trash} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function TrashModal({ trash, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-destructive/40 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron text-lg font-bold text-destructive tracking-wider">TRASH ({trash.length})</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {trash.map((card, i) => (
            <div key={i}>
              <GameCard card={card} showDetails={false} hideAttackPower />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}