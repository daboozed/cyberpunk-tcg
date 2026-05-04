import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Swords } from "lucide-react";
import GigDice from "./GigDice";

export default function GigStealModal({ availableGigs, count, attackerName, onSteal }) {
  if (!availableGigs || availableGigs.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-secondary/60 rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl shadow-secondary/20">
        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-5 h-5 text-secondary animate-pulse" />
          <h2 className="font-orbitron text-base font-bold text-secondary tracking-wider">CHOOSE A GIG TO STEAL</h2>
        </div>
        <p className="text-xs font-mono text-muted-foreground mb-5">
          {attackerName} wins! Choose which opponent Gig to take.
          {count > 1 && <span className="text-secondary ml-2">({count} steals remaining)</span>}
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          {availableGigs.map((die, i) => (
            <button
              key={die.id || i}
              onClick={() => onSteal(die.id)}
              className={cn(
                "group flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border/40",
                "hover:border-secondary/60 hover:bg-secondary/10 transition-all hover:scale-110 cursor-pointer"
              )}
            >
              <GigDice die={die} />
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-secondary transition-colors">
                {die.label} — {die.value}★
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}