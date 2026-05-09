import CardHoverPreview from "@/components/game/CardHoverPreview";
import { PHASES } from "@/lib/engine/gameEngine";
import { CARD_BACK } from "@/lib/cardPool";

export default function MulliganOverlay({
  gs,
  isMultiplayer,
  handleMulligan,
  mulliganPreview,
  setMulliganPreview,
  mousePos,
  setMousePos,
}) {
  if (gs?.phase !== PHASES.MULLIGAN) {
    return null;
  }

  return (
    <>
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="rounded-2xl border border-fuchsia-500 bg-zinc-950/95 p-6 text-center shadow-[0_0_40px_rgba(217,70,239,0.2)]">
          <h2 className="mb-3 font-orbitron text-2xl text-fuchsia-300">
            Mulligan
          </h2>

          <p className="mb-5 max-w-md text-sm text-zinc-300">
            {isMultiplayer
              ? "Keep your opening hand or redraw once."
              : "Choose whether to redraw your starting hand."}
          </p>

          <div className="mb-5 flex flex-wrap justify-center gap-3">
            {(gs?.player?.hand || []).map((card, index) => (
              <button
                key={`${card?.uid || card?.id || 'card'}-${index}`}
                onMouseEnter={() => setMulliganPreview(card)}
                onMouseLeave={() => setMulliganPreview(null)}
                onMouseMove={(e) =>
                  setMousePos({ x: e.clientX, y: e.clientY })
                }
                className="rounded-md border border-zinc-700 bg-zinc-900 p-1 hover:border-cyan-400 hover:shadow-[0_0_14px_rgba(34,211,238,0.45)] transition"
                title={card?.name || "Unknown Card"}
              >
                <img
                  src={card?.imageUrl || CARD_BACK}
                  alt={card?.name || "Unknown Card"}
                  className="h-40 w-28 rounded object-cover"
                />
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleMulligan(false)}
              className="rounded-md border border-zinc-500 bg-zinc-800 px-4 py-2 font-orbitron text-zinc-100 hover:bg-zinc-700"
            >
              Keep Hand
            </button>

            <button
              onClick={() => handleMulligan(true)}
              className="rounded-md border border-cyan-400 bg-cyan-500 px-4 py-2 font-orbitron text-black hover:bg-cyan-400"
            >
              Mulligan
            </button>
          </div>
        </div>
      </div>

      {mulliganPreview && (
        <CardHoverPreview card={mulliganPreview} mousePos={mousePos} />
      )}
    </>
  );
}
