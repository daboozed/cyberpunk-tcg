import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import GigDice from "./GigDice";

export default function ChooseGigModal({ gigs, amount, title, description, onChoose }) {
  if (!gigs || gigs.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-violet-500/60 rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl shadow-violet-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-violet-400" />
          <h2 className="font-orbitron text-base font-bold text-violet-400 tracking-wider">
            {title || 'CHOOSE A GIG'}
          </h2>
        </div>
        <p className="text-xs font-mono text-muted-foreground mb-5">
          {description || `Select a Gig to boost by +${amount}.`}
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          {gigs.map((die, i) => {
            const newVal = Math.min(die.sides, die.value + (amount || 0));
            return (
              <button
  key={die.id || i}
  type="button"
  onClick={() => {
    console.log("MODAL CLICK", die.id);
    onChoose?.(die.id);
  }}
  className="p-4 border border-red-500 bg-black text-white"
>
  PICK {die.label} ({die.value})
</button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}