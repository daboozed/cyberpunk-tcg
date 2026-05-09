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
    </div>
  );
}
