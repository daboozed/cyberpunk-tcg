import { PHASES } from "@/lib/engine/gameEngine";

export function useGameViewState({
  gs,
  disableActions,
  isGameOver,
  gearTarget,
  selectedAttacker,
  actualIndex,
  canPlay,
  canSell,
  attackBtn,
}) {
  let phaseButtonLabel = "ATTACK PHASE";
  let phaseButtonDisabled = false;
  let phaseButtonStyle = attackBtn;

  if (gs.phase === PHASES.READY || gs.phase === PHASES.PICK_GIG) {
    phaseButtonLabel = "PLAY PHASE";
    phaseButtonDisabled = true;
    phaseButtonStyle = `
  bg-yellow-500 text-black border-yellow-300
  shadow-[0_0_12px_rgba(255,255,0,0.8)]
  animate-pulse [animation-duration:2s]
`;
  }

  if (gs.phase === PHASES.PLAY) {
    phaseButtonLabel = "ATTACK PHASE";
    phaseButtonDisabled = false;
    phaseButtonStyle = attackBtn;
  }

  if (gs.phase === PHASES.ATTACK) {
    phaseButtonLabel = "ATTACK PHASE";
    phaseButtonDisabled = true;
    phaseButtonStyle = `
    bg-gray-600 text-gray-300 border-gray-500
    opacity-50 cursor-not-allowed
  `;
  }

  function getDerivedMessage() {
    if (disableActions) return "Waiting for opponent's move...";
    if (isGameOver) return gs.message || (gs.winner === "player" ? "You win!" : "Defeat.");
    if (gearTarget !== null) return "Select a friendly unit to equip this Gear to.";
    if (gs.awaitingTarget) return "Select a target to apply the effect.";
    if (gs.phase === PHASES.PICK_GIG) return "Pick a Fixer Die to roll your Gig.";
    if (gs.phase === PHASES.PLAY) {
      if (selectedAttacker) return "Attacker selected — go to Attack Phase to attack, or deselect.";
      if (actualIndex !== null) {
        const card = gs.player?.hand[actualIndex];
        if (card) {
          if (!canPlay) return `Not enough Eddies to play ${card.name} (costs ${card.cost || 0}).`;
          return `Play ${card.name}${canSell ? " or sell it for €$1." : "."}`;
        }
      }
      return "Play cards, sell for Eddies, or move to Attack Phase.";
    }
    if (gs.phase === PHASES.ATTACK) {
      if (selectedAttacker) return "Attack a spent rival unit, or attack rival directly to steal a Gig.";
      return "Select one of your units to attack with, or end your turn.";
    }
    if (gs.phase === PHASES.MULLIGAN) return "Mulligan your hand or keep it.";
    if (gs.phase === PHASES.READY) return "Ready phase — preparing your turn...";
    return "";
  }

  return {
    phaseButtonLabel,
    phaseButtonDisabled,
    phaseButtonStyle,
    getDerivedMessage,
  };
}
