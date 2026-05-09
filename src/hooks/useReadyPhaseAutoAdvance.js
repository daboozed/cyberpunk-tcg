import { useEffect } from "react";
import { readyPhase, PHASES } from "@/lib/engine/gameEngine";

export function useReadyPhaseAutoAdvance({
  gs,
  setGs,
  isMultiplayer,
  waitingForOpponent,
  setRolledThisTurn,
}) {
  useEffect(() => {
    if (gs.phase === PHASES.READY && (!isMultiplayer || !waitingForOpponent)) {
      setRolledThisTurn(false);

      const timer = setTimeout(() => setGs(prev => readyPhase(prev)), 600);
      return () => clearTimeout(timer);
    }
  }, [gs.phase, gs.turn, waitingForOpponent]);
}
