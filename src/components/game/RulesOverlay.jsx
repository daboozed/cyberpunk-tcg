export default function RulesOverlay({ showRules, setShowRules }) {
  if (!showRules) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-cyan-400 bg-zinc-950 p-6 text-zinc-200 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-orbitron text-2xl text-cyan-300">Rules</h2>

          <button
            onClick={() => setShowRules(false)}
            className="rounded-md border border-zinc-600 px-3 py-1 text-sm hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            Build your board, roll Fixer Dice for Gigs, and attack the opponent to gain Street Cred.
          </p>

          <p>
            During the Play Phase you may play cards, call Legends, equip Gear, and prepare attacks.
          </p>

          <p>
            During the Attack Phase, ready units may attack spent enemy units or enemy Gigs.
          </p>

          <p>
            If a blocker is available, the defending player may BLOCK or PASS.
          </p>
        </div>
      </div>
    </div>
  );
}
