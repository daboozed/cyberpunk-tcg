import { useState } from "react";
import "./theme.css";
import { Link, useNavigate } from "react-router-dom";
import {
  Cpu,
  Plus,
  Users,
} from "lucide-react";
import LoadDeckModal from "@/components/game/LoadDeckModal";
import DiscordLoginPanel from "@/components/auth/DiscordLoginPanel";

export default function Home() {
  const navigate = useNavigate();

  const [showLoadDeck, setShowLoadDeck] = useState(false);

  const [deckLoaded, setDeckLoaded] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem("cpTCG_deck") || "null");
      return d && d.legends?.length === 3;
    } catch {
      return false;
    }
  });

  const [loadedDeckName, setLoadedDeckName] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem("cpTCG_deck") || "null");
      return d?.name || null;
    } catch {
      return null;
    }
  });

  const handleDeckLoaded = (deck) => {
    setDeckLoaded(true);
    setLoadedDeckName(deck.name);
  };

  const startQuickplay = () => {
    localStorage.setItem("cpTCG_aiDifficulty", "medium");
    navigate("/game?mode=ai");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.35)), url('/background.webp')",
        }}
      />

      <div className="relative z-10 min-h-screen">
        <div className="absolute left-[25px] top-[25px] leading-none uppercase tracking-tight">
          <h1 className="bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-[34px] font-black text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,.8)] md:text-[50px]">
            BUILD YOUR CREW.
          </h1>

          <h1 className="mt-1 bg-gradient-to-b from-red-400 via-red-600 to-red-900 bg-clip-text text-[34px] font-black text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,.8)] md:text-[50px]">
            OWN NIGHT CITY.
          </h1>
        </div>

        <div className="hidden md:block absolute left-[80px] top-[325px]">
          <div className="relative h-[280px] w-[460px]">
            <div className="absolute left-6 top-10 rotate-[-14deg] transition hover:scale-105">
              <img
                className="h-48 w-32 rounded-xl border border-rose-500/60 object-cover"
                src="https://exburst.dev/cyberpunk/cards/hd/697107581860bf853828ac16_a026.webp"
              />
            </div>

            <div className="absolute left-[155px] top-0 z-20 transition hover:scale-105">
              <img
                className="h-52 w-36 rounded-xl border border-amber-500/60 object-cover"
                src="https://exburst.dev/cyberpunk/cards/hd/n001_1773925986628.webp"
              />
            </div>

            <div className="absolute right-6 top-10 rotate-[14deg] transition hover:scale-105">
              <img
                className="h-48 w-32 rounded-xl border border-cyan-500/60 object-cover"
                src="https://exburst.dev/cyberpunk/cards/hd/HDev-srW8AEOtTs_fx_1773657698631.webp"
              />
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-[220px] w-[calc(100%-32px)] max-w-[360px] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-md md:left-auto md:right-[420px] md:top-[120px] md:w-[360px] md:translate-x-0">
          <div className="border-b border-white/10 p-4 text-center">
            <h2 className="text-sm font-bold tracking-widest">
              ENTER NEON CITY
            </h2>

            <p className="mt-1 text-[11px] text-white/60">
              Cyberpunk TCG Simulator
            </p>
          </div>

          <div className="space-y-2 p-4">
            <DiscordLoginPanel />

            {deckLoaded && (
              <>
                <div className="rounded border border-green-500/30 p-2 text-xs text-green-400">
                  Deck loaded: {loadedDeckName}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-sm text-cyan-200 transition-all duration-200 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)]">
                    <Users size={16} />
                    Join Table
                  </button>

                  <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 text-sm text-fuchsia-200 transition-all duration-200 hover:bg-fuchsia-500/20 hover:shadow-[0_0_12px_rgba(217,70,239,0.25)]">
                    <Plus size={16} />
                    Create Table
                  </button>
                </div>
              </>
            )}

            <button
              disabled={!deckLoaded}
              onClick={startQuickplay}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 transition-all duration-200 active:scale-[0.98] hover:border-cyan-400/70 hover:bg-white/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] disabled:opacity-40"
            >
              <Cpu size={16} />
              Quickplay AI
            </button>

            <Link to="/deckbuilder" className="block">
              <button className="h-10 w-full rounded-lg border border-white/20 bg-white/10 transition-all duration-200 hover:border-cyan-400/70 hover:bg-white/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                Deck Builder
              </button>
            </Link>

            <button
              onClick={() => setShowLoadDeck(true)}
              className="h-10 w-full rounded-lg border border-white/20 bg-white/10 transition-all duration-200 hover:border-cyan-400/70 hover:bg-white/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]"
            >
              Load Deck
            </button>

            <Link to="/rules" className="block">
              <button className="h-10 w-full rounded-lg border border-white/20 bg-white/10 transition-all duration-200 hover:border-cyan-400/70 hover:bg-white/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                Rules
              </button>
            </Link>
          </div>

          <div className="border-t border-white/10 py-3 text-center text-[10px] text-white/30">
            Fan-made Cyberpunk TCG simulator
          </div>
        </div>
      </div>

      {showLoadDeck && (
        <LoadDeckModal
          onClose={() => setShowLoadDeck(false)}
          onLoad={(deck) => {
            localStorage.setItem("cpTCG_deck", JSON.stringify(deck));
            handleDeckLoaded(deck);
          }}
        />
      )}
    </div>
  );
}
