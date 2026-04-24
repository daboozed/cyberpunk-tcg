import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PHASES } from "@/lib/engine/helpers";
import { Swords, Play, SkipForward, RefreshCw, HandMetal, ShoppingCart, Crown } from "lucide-react";

export default function ActionBar({
  phase,
  selectedCard,
  selectedAttacker,
  onSellCard,
  onPlayCard,
  onStartAttack,
  onEndTurn,
  onAttackRival,
  onNewGame,
  canSell,
  canPlay,
  message,
  onCallLegendSolo,
  callableLegendIndex,
  canCallSolo,
  canStartAttack,
}) {
  return (
    <div className="w-full space-y-2">
      {/* Message */}
      <div className="px-3 py-2 rounded-lg" style={{ border: '1px solid rgba(0,255,255,0.25)', background: 'rgba(0,255,255,0.05)' }}>
        <p className="text-xs md:text-sm font-rajdhani text-center" style={{ color: 'rgba(0,255,255,0.85)' }}>
          {message}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {phase === PHASES.PLAY && (
          <>
            {canCallSolo && callableLegendIndex !== null && (
              <Button
                size="sm"
                onClick={() => onCallLegendSolo(callableLegendIndex)}
                className="gap-1.5 border-yellow-400/80 text-yellow-300 bg-yellow-500/20 hover:bg-yellow-500/30 font-rajdhani text-xs animate-pulse"
                style={{
                  boxShadow: '0 0 12px rgba(250, 204, 21, 0.5)',
                  border: '2px solid rgba(250, 204, 21, 0.8)'
                }}
              >
                <Crown className="w-3.5 h-3.5" />
                GO SOLO
              </Button>
            )}
            {selectedCard !== null && canSell && (
              <Button
  size="sm"
  variant="outline"
  onClick={onStartAttack}
  disabled={!canStartAttack} // 🔥 THIS IS THE KEY
  className={cn(
    "gap-1.5 border-red-500/50 text-red-400 font-rajdhani text-xs",
    canStartAttack
      ? "hover:bg-red-500/10"
      : "opacity-40 cursor-not-allowed"
  )}
>
                <ShoppingCart className="w-3.5 h-3.5" />
                Sell for €$
              </Button>
            )}
            {selectedCard !== null && canPlay && (
              <Button
                size="sm"
                onClick={onPlayCard}
                className="gap-1.5 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-rajdhani text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                Play Card
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onStartAttack}
              className="gap-1.5 border-red-500/50 text-red-400 hover:bg-red-500/10 font-rajdhani text-xs"
            >
              <Swords className="w-3.5 h-3.5" />
              Attack Phase
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEndTurn}
              className="gap-1.5 border-muted-foreground/30 text-muted-foreground hover:bg-muted font-rajdhani text-xs"
            >
              <SkipForward className="w-3.5 h-3.5" />
              End Turn
            </Button>
          </>
        )}

        {phase === PHASES.ATTACK && (
          <>
            {selectedAttacker && (
              <Button
                size="sm"
                onClick={onAttackRival}
                className="gap-1.5 bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 font-rajdhani text-xs"
              >
                <Swords className="w-3.5 h-3.5" />
                Attack Rival (Steal Gig)
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onEndTurn}
              className="gap-1.5 border-muted-foreground/30 text-muted-foreground hover:bg-muted font-rajdhani text-xs"
            >
              <SkipForward className="w-3.5 h-3.5" />
              End Turn
            </Button>
          </>
        )}

        {phase === PHASES.GAME_OVER && (
          <Button
            size="sm"
            onClick={onNewGame}
            className="gap-1.5 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-rajdhani"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Game
          </Button>
        )}
      </div>
    </div>
  );
}