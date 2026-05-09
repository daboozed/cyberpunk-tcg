import { HelpCircle, LogOut } from "lucide-react";

export default function GameTopBar({
  showRules,
  setShowRules,
  setShowCombatLog,
  handleLeaveRoom,
}) {
  return (
    <div className="absolute top-4 right-4 z-40 flex gap-2">
      <button
        onClick={() => setShowRules(!showRules)}
        className="flex items-center gap-2 px-3 py-2 rounded bg-black/70 border border-cyan-400 text-cyan-300 hover:bg-cyan-950/50"
      >
        <HelpCircle className="w-4 h-4" />
        Rules
      </button>

      <button
        onClick={() => setShowCombatLog(true)}
        className="px-3 py-2 rounded bg-black/70 border border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-950/50"
      >
        Combat Log
      </button>

      <button
        onClick={handleLeaveRoom}
        className="flex items-center gap-2 px-3 py-2 rounded bg-black/70 border border-red-400 text-red-300 hover:bg-red-950/50"
      >
        <LogOut className="w-4 h-4" />
        Leave
      </button>
    </div>
  );
}
