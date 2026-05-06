import { Loader2 } from "lucide-react";

export default function WaitingForOpponentOverlay({
  isMultiplayer,
  waitingForOpponent,
  isGameOver,
  myRoleRef,
}) {
  if (!isMultiplayer || !waitingForOpponent || isGameOver) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-xl border border-cyan-500 bg-zinc-950/90 px-6 py-5 text-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-cyan-400" />

        <p className="font-orbitron text-lg text-cyan-200">
          Waiting for opponent...
        </p>

        <p className="mt-2 text-sm text-zinc-400">
          You are {myRoleRef?.current === "player2" ? "Player 2" : "Player 1"}
        </p>
      </div>
    </div>
  );
}
