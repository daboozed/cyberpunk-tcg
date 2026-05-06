import { Home, Crown } from "lucide-react";

export default function GameOverOverlay({
  isGameOver,
  gs,
  handleNewGame,
  navigate,
  isMultiplayer,
}) {
  if (!isGameOver) return null;

  const didWin = gs?.winner === "player";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400 bg-zinc-950/95 p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.25)]">
        <div className="mb-4 flex justify-center">
          <Crown className="h-12 w-12 text-yellow-400" />
        </div>

        <h2 className="mb-2 font-orbitron text-3xl text-white">
          {didWin ? "VICTORY" : "DEFEAT"}
        </h2>

        <p className="mb-6 text-zinc-300">
          {gs?.message || (didWin ? "You win!" : "Defeat.")}
        </p>

        <div className="flex items-center justify-center gap-3">
          {!isMultiplayer && (
            <button
              onClick={handleNewGame}
              className="rounded-md border border-cyan-400 bg-cyan-500 px-4 py-2 font-orbitron text-black hover:bg-cyan-400"
            >
              New Game
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-md border border-zinc-500 bg-zinc-800 px-4 py-2 font-orbitron text-zinc-100 hover:bg-zinc-700"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
