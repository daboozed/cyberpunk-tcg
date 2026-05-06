import { cn } from "@/lib/utils";

export default function GameActionBar({
  actionBtn,
  phaseButtonStyle,
  phaseButtonLabel,
  phaseButtonDisabled,
  handleStartAttack,
  pendingBlock,
  passBtn,
  handleBlockerDecision,
  endTurnBtn,
  handleEndTurn,
  handleDebugIncreaseAllGigs,
}) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <button
        className={cn(actionBtn, phaseButtonStyle)}
        onClick={handleStartAttack}
        disabled={phaseButtonDisabled}
      >
        {phaseButtonLabel}
      </button>

      {pendingBlock && (
        <button
          className={cn(actionBtn, passBtn)}
          onClick={() => handleBlockerDecision(null)}
        >
          PASS
        </button>
      )}

      <button
        className={cn(actionBtn, endTurnBtn)}
        onClick={handleEndTurn}
        disabled={!!pendingBlock}
      >
        END TURN
      </button>

      <button
        className={cn(
          actionBtn,
          "bg-purple-600 text-white border-purple-300 shadow-[0_4px_0_rgb(88,28,135)] hover:bg-purple-500 active:translate-y-[2px] active:shadow-none"
        )}
        onClick={handleDebugIncreaseAllGigs}
      >
        +1 ALL GIGS
      </button>
    </div>
  );
}
