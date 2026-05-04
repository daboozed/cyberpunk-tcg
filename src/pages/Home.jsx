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
          <h1 className="text-[50px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-600 drop-shadow-[0_4px_12px_rgba(0,0,0,.8)]">
            BUILD YOUR CREW.
          </h1>

          <h1 className="text-[50px] font-black mt-1 text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-600 to-red-900 drop-shadow-[0_4px_12px_rgba(0,0,0,.8)]">
            OWN NIGHT CITY.
          </h1>
        </div>

        {/* ================= CARD SHOWCASE ================= */}
        <div className="absolute left-[80px] top-[325px]">
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

<<<<<<< HEAD
        {/* ================= MAIN MENU PANEL ================= */}
        <div className="absolute right-[180px] top-[120px] w-[360px] bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">

          <div className="p-4 border-b border-white/10 text-center">
            <h2 className="text-sm font-bold tracking-widest">
              ENTER NEON CITY
            </h2>
            <p className="text-[11px] text-white/60 mt-1">
              Cyberpunk TCG Simulator
            </p>
          </div>

          <div className="p-4 space-y-3">

            <button
              onClick={() =>
                window.open(
                  "http://localhost:3001/auth/discord",
                  "discordLogin",
                  "width=520,height=720"
                )
              }
              className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg"
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
              className="w-full h-10 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-lg flex items-center justify-center gap-2"
            >
              <Cpu size={16} />
              Quickplay AI
            </button>

            <Link to="/deckbuilder">
              <button className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg">
                Deck Builder
              </button>
            </Link>

            <button
              onClick={() => setShowLoadDeck(true)}
              className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              Load Deck
            </button>

            <Link to="/rules">
              <button className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg">
                Rules
              </button>
            </Link>

          </div>

          <div className="text-[10px] text-center text-white/30 py-3 border-t border-white/10">
            Fan-made Cyberpunk TCG simulator
=======
        {/* Main Panel */}
        <div className="w-full max-w-sm bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

  <div className="bg-muted/60 px-6 py-4 border-b border-border/40 text-center">
    <h2 className="font-orbitron text-base sm:text-lg font-bold text-foreground tracking-wider">
      ENTER NEON CITY
    </h2>

    <p className="font-rajdhani text-xs text-muted-foreground mt-0.5">
      Neon City Duel — Fan-made Simulator for the Cyberpunk TCG
    </p>
  </div>

  <div className="p-4 space-y-3">

    <button
      onClick={() => {
        window.open(
          "http://localhost:3001/auth/discord",
          "discordLogin",
          "width=520,height=720"
        );
      }}
      className="btn w-full"
    >
      Login With Discord
    </button>

    {deckLoaded && (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <span className="text-xs font-mono text-green-400 truncate">
          Deck loaded: {loadedDeckName || "Custom Deck"}
        </span>
      </div>
    )}

    <button
      disabled={!deckLoaded}
      onClick={startQuickplay}
      className={`w-full h-11 flex items-center justify-center gap-3 rounded-xl font-rajdhani font-semibold text-sm tracking-wider transition-all duration-200
      ${deckLoaded
        ? "bg-muted/30 border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        : "bg-muted/20 border border-border/30 text-muted-foreground/40 cursor-not-allowed"}`}
    >
      <Cpu className="w-4 h-4" />
      Quickplay - AI
    </button>

    <Link to="/deckbuilder" className="block">
      <button className="w-full h-11 flex items-center justify-center gap-3 rounded-xl font-rajdhani font-semibold text-sm tracking-wider transition-all duration-200 bg-muted/30 border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
        <Layers className="w-4 h-4" />
        Deck Builder
      </button>
    </Link>

    <button
      onClick={() => setShowLoadDeck(true)}
      className="w-full h-11 flex items-center justify-center gap-3 rounded-xl font-rajdhani font-semibold text-sm tracking-wider transition-all duration-200 bg-muted/30 border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    >
      <FolderOpen className="w-4 h-4" />
      Load Deck
    </button>

  </div>

  <p className="py-3 text-[10px] text-muted-foreground/40 font-mono text-center border-t border-border/20">
    Fan-made simulator · Not affiliated with CD Projekt Red
  </p>

</div>

        {/* Rules Panel */}
        <div className="w-full max-w-2xl bg-card/70 backdrop-blur-md border border-primary/20 rounded-2xl p-4 sm:p-6 mb-8">
          <h2 className="font-orbitron text-base font-bold text-primary tracking-wider mb-4">HOW TO PLAY</h2>

          <div className="mb-4 p-3 rounded-xl border border-primary/20 bg-primary/5">
            <h3 className="font-orbitron text-xs font-bold text-primary mb-2">GAME SETUP</h3>
            <ul className="space-y-1 text-xs font-rajdhani text-foreground/80">
              <li>• Each player has 3 face-down Legends, a shuffled deck between 40-50 cards with no more then 3 of the same card, and 6 Gig Dice in the Fixer Area (d4, d6, d8, d10, d12, d20).</li>
              <li>• Draw 6 cards. You may mulligan once (shuffle back and redraw 6).</li>
              <li>• Randomly choose who goes first. First player spends 2 of their Legends.</li>
              <li>• The d20 must always be the last die taken from the Fixer Area.</li>
            </ul>
          </div>

          <div className="space-y-2">
            {SECTIONS.map((section) => (
              <div key={section.title} className={`p-3 rounded-xl border ${section.border} bg-card/50`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <section.icon className={`w-3.5 h-3.5 ${section.color}`} />
                  <h3 className={`font-orbitron text-xs font-bold ${section.color}`}>{section.title}</h3>
                </div>
                <ul className="space-y-1">
                  {section.content.map((line, j) => (
                    <li key={j} className="text-xs font-rajdhani text-foreground/75 leading-relaxed">• {line}</li>
                  ))}
                </ul>
              </div>
            ))}
>>>>>>> dev
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

