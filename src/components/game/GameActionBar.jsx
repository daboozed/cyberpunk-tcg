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
    <div className="flex gap-4 justify-center mt-4">
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
        className="px-6 py-2 rounded-md border border-green-400 text-green-300 bg-black hover:bg-green-900"
        onClick={handleDebugIncreaseAllGigs}
      >
        +1 ALL GIGS
      </button>
    </div>
  );
}
