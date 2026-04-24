import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Shield, Swords, ChevronRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUnitPower } from "@/lib/engine/gameEngine";

export default function BlockerDecisionModal({ pendingAttack, playerField, onBlock, onAllow }) {
  const [selectedBlocker, setSelectedBlocker] = useState(null);

  if (!pendingAttack) return null;

  const { attacker } = pendingAttack;
  const atkPower = getUnitPower(attacker);
  const blockers = playerField.filter(u => !u.spent && (u.keywords?.includes('blocker') || u.tempBlocker));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-destructive/60 rounded-2xl p-6 mx-4 max-w-lg w-full shadow-2xl shadow-destructive/20">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Swords className="w-5 h-5 text-destructive animate-pulse" />
          <h2 className="font-orbitron text-base font-bold text-destructive tracking-wider">INCOMING ATTACK!</h2>
        </div>

        {/* Attacker card */}
        <div className="flex flex-col items-center mb-4">
          <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Opponent's Attacker</p>
          <div className="relative w-28 h-40 rounded-xl border-2 border-destructive/70 overflow-hidden shadow-lg shadow-destructive/30">
            {attacker.imageUrl
              ? <img src={attacker.imageUrl} alt={attacker.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-red-950" />
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-2 text-center">
              <p className="font-rajdhani font-bold text-xs text-white leading-tight">{attacker.name}</p>
            </div>
          </div>
          {/* Power badge */}
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/50">
            <Swords className="w-3.5 h-3.5 text-destructive" />
            <span className="font-orbitron font-bold text-destructive text-sm">{atkPower} ATK</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border/50" />
          <ArrowDown className="w-4 h-4 text-destructive/70" />
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Blocker options */}
        <div className="mb-5">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">Your Blockers — Select one to intercept:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {blockers.map(blocker => {
              const defPower = getUnitPower(blocker, true);
              const survives = defPower > atkPower;
              const ties = defPower === atkPower;
              const isSelected = selectedBlocker?.uid === blocker.uid;

              return (
                <div
                  key={blocker.uid}
                  onClick={() => setSelectedBlocker(isSelected ? null : blocker)}
                  className={cn(
                    "flex flex-col items-center cursor-pointer rounded-xl p-1.5 border-2 transition-all",
                    isSelected
                      ? "border-amber-400 bg-amber-400/10 scale-105"
                      : "border-border/40 hover:border-amber-400/50"
                  )}
                >
                  <div className="relative w-16 h-24 rounded-lg border border-border/40 overflow-hidden">
                    {blocker.imageUrl
                      ? <img src={blocker.imageUrl} alt={blocker.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-muted" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-1 text-center">
                      <p className="font-rajdhani font-bold text-[9px] text-white leading-tight line-clamp-2">{blocker.name}</p>
                    </div>
                  </div>
                  {/* Defense power with outcome hint */}
                  <div className={cn(
                    "mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-orbitron font-bold",
                    survives ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : ties ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-red-500/20 border-red-500/50 text-red-400"
                  )}>
                    <Shield className="w-2.5 h-2.5" />
                    {defPower} DEF
                    <span className="ml-0.5">
                      {survives ? "✓" : ties ? "≈" : "✗"}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[8px] font-mono mt-0.5",
                    survives ? "text-green-400" : ties ? "text-amber-400" : "text-red-400"
                  )}>
                    {survives ? "survives" : ties ? "both die" : "destroyed"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 font-rajdhani text-sm border-muted-foreground/30 text-muted-foreground hover:bg-muted"
            onClick={onAllow}
          >
            Allow Attack
            <span className="text-[10px] ml-1 text-muted-foreground/60">(lose a Gig)</span>
          </Button>
          <Button
            disabled={!selectedBlocker}
            className="flex-1 font-rajdhani text-sm bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40"
            onClick={() => selectedBlocker && onBlock(selectedBlocker.uid)}
          >
            <Shield className="w-3.5 h-3.5 mr-1" />
            Block Attack
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}