import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Zap, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import GigDice from "./GigDice";
import { getUnitPower } from "@/lib/engine/helpers";

export default function AdjustGigModal({ rivalGigs, playerGigs, onAdjust, onClose }) {
  const [selectedGig, setSelectedGig] = useState(0);
  const [adjustment, setAdjustment] = useState(0);

  const gig = rivalGigs[selectedGig];
  const newValue = Math.max(1, Math.min(gig.sides, gig.value + adjustment));
  const matchesPlayerGig = playerGigs.some(d => d.value === newValue);

  const handleConfirm = () => {
    onAdjust(selectedGig, adjustment);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-violet-500/60 rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-violet-500/20 p-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-violet-400" />
          <h2 className="font-orbitron text-lg font-bold text-violet-400 tracking-wider">AFTERPARTY AT LIZZIE'S</h2>
        </div>

        {/* Gig selection (if multiple) */}
        {rivalGigs.length > 1 && (
          <div className="mb-4 pb-4 border-b border-border/40">
            <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Select Opponent's Gig to Adjust</p>
            <div className="flex gap-2 flex-wrap">
              {rivalGigs.map((die, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGig(i)}
                  className={cn(
                    "relative transition-all",
                    selectedGig === i && "scale-110 ring-2 ring-violet-400"
                  )}
                >
                  <GigDice die={die} small />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Adjustment controls */}
        <div className="mb-4">
          <p className="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-wider">Adjust Value by:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[-2, -1, 1, 2].map(value => (
              <button
                key={value}
                onClick={() => setAdjustment(value)}
                className={cn(
                  "py-2 px-3 rounded-lg border-2 font-orbitron font-bold transition-all",
                  adjustment === value
                    ? "bg-violet-500/30 border-violet-400 text-violet-300"
                    : "border-border/40 text-muted-foreground hover:border-violet-400/50"
                )}
              >
                {value > 0 ? '+' : ''}{value}
            </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">Current:</span>
              <GigDice die={gig} small />
            </div>
            <span className="text-muted-foreground/50">→</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">New:</span>
              <div className="relative flex flex-col items-center justify-center rounded-lg font-orbitron w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-violet-400 to-violet-600 shadow-lg">
                <span className="font-bold text-white drop-shadow-lg text-xs md:text-sm">{newValue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player gigs */}
        <div className="mb-4 pb-4 border-b border-border/40">
          <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Your Gigs</p>
          <div className="flex gap-2 flex-wrap">
            {playerGigs.length === 0 && <span className="text-xs font-mono text-muted-foreground/50">No gigs yet</span>}
            {playerGigs.map((die, i) => (
              <div key={i} className={cn("transition-all", die.value === newValue && "ring-2 ring-green-400 rounded-lg scale-110")}>
                <GigDice die={die} small />
              </div>
            ))}
          </div>
          {matchesPlayerGig && (
            <p className="text-xs font-mono text-green-400 mt-1">✓ Match! You'll draw a card.</p>
          )}
        </div>

        {/* Confirm button */}
        <Button
          onClick={handleConfirm}
          disabled={adjustment === 0}
          className="w-full font-rajdhani font-bold bg-violet-500/20 border border-violet-500/50 text-violet-300 hover:bg-violet-500/30 disabled:opacity-40 gap-2"
        >
          <Zap className="w-4 h-4" />
          Adjust & Resolve
        </Button>
      </div>
    </div>,
    document.body
  );
}