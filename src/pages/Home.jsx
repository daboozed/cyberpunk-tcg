import { useState } from "react";
import "./theme.css";
import { Link, useNavigate } from "react-router-dom";
import {
  Swords,
  Layers,
  FolderOpen,
  Cpu,
  Crown,
  ChevronRight,
  Coins,
  Zap,
  Shield,
  FileText,
} from "lucide-react";
import LoadDeckModal from "@/components/game/LoadDeckModal";

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

      {/* ================= BACKGROUND ================= */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.35)), url('/background.webp')",
        }}
      />

      {/* ================= HUD ROOT ================= */}
      <div className="relative z-10 min-h-screen">

        {/* ================= TITLE HUD ================= */}
        <div className="absolute left-[25px] top-[25px] leading-none uppercase tracking-tight">
          <h1 className="text-[34px] md:text-[50px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-600 drop-shadow-[0_4px_12px_rgba(0,0,0,.8)]">
            BUILD YOUR CREW.
          </h1>

          <h1 className="text-[34px] md:text-[50px] font-black mt-1 text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-600 to-red-900 drop-shadow-[0_4px_12px_rgba(0,0,0,.8)]">
            OWN NIGHT CITY.
          </h1>
        </div>

        {/* ================= CARD SHOWCASE ================= */}
        <div className="hidden md:block absolute left-[80px] top-[325px]">
          <div className="relative w-[460px] h-[280px]">

            {/* LEFT CARD */}
            <div className="absolute left-6 top-10 rotate-[-14deg] hover:scale-105 transition">
              <img
                className="w-32 h-48 rounded-xl border border-rose-500/60 object-cover"
                src="https://exburst.dev/cyberpunk/cards/hd/697107581860bf853828ac16_a026.webp"
              />
            </div>

            {/* CENTER CARD */}
            <div className="absolute left-[155px] top-0 hover:scale-105 transition z-20">
              <img
                className="w-36 h-52 rounded-xl border border-amber-500/60 object-cover"
                src="https://exburst.dev/cyberpunk/cards/hd/n001_1773925986628.webp"
              />
            </div>

            {/* RIGHT CARD */}
            <div className="absolute right-6 top-10 rotate-[14deg] hover:scale-105 transition">
              <img
                className="w-32 h-48 rounded-xl border border-cyan-500/60 object-cover"
                src="https://exburst.dev/cyberpunk/cards/hd/HDev-srW8AEOtTs_fx_1773657698631.webp"
              />
            </div>

          </div>
        </div>

        {/* ================= MAIN MENU PANEL ================= */}
        <div className="absolute left-1/2 top-[220px] w-[calc(100%-32px)] max-w-[360px] -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl md:left-auto md:right-[420px] md:top-[120px] md:w-[360px] md:translate-x-0">

          <div className="p-4 border-b border-white/10 text-center">
            <h2 className="text-sm font-bold tracking-widest">
              ENTER NEON CITY
            </h2>
            <p className="text-[11px] text-white/60 mt-1">
              Cyberpunk TCG Simulator
            </p>
          </div>

          <div className="p-4 space-y-2">

            <button
              onClick={() =>
                window.open(
                  "http://localhost:3001/auth/discord",
                  "discordLogin",
                  "width=520,height=720"
                )
              }
              className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/70 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-200"
            >
              Login With Discord
            </button>

            {deckLoaded && (
              <div className="text-xs text-green-400 border border-green-500/30 p-2 rounded">
                Deck loaded: {loadedDeckName}
              </div>
            )}

            <button
              disabled={!deckLoaded}
              onClick={startQuickplay}
              className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/70 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-200 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Cpu size={16} />
              Quickplay AI
            </button>

            <Link to="/deckbuilder" className="block">
              <button className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/70 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-200">
                Deck Builder
              </button>
            </Link>

            <button
              onClick={() => setShowLoadDeck(true)}
              className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/70 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-200"
            >
              Load Deck
            </button>

            <Link to="/rules" className="block">
              <button className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/70 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-200">
                Rules
              </button>
            </Link>

          </div>

          <div className="text-[10px] text-center text-white/30 py-3 border-t border-white/10">
            Fan-made Cyberpunk TCG simulator
          </div>
        </div>

      </div>

      {/* ================= MODAL ================= */}
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

