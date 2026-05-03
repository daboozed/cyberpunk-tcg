import { useState, useEffect } from "react";
import "./theme.css";
import { Link, useNavigate } from "react-router-dom";
import { Swords, Layers, FolderOpen, Cpu, Crown, ChevronRight, Coins, Zap, Shield, FileText } from "lucide-react";
import LoadDeckModal from "@/components/game/LoadDeckModal";



const SECTIONS = [
  { title: 'WIN CONDITION', icon: Crown, color: 'text-amber-400', border: 'border-amber-500/30', content: [
    'Start your turn with 6 or more Gig Dice in your Gig Area to win.',
    'Collect 7 Gigs at any time for an instant win.',
    "If your rival's deck runs out, you win automatically.",
    "If both players run out of Fixer dice, the game enters OVERTIME — first to majority of Gigs wins instantly.",
  ]},
  { title: 'TURN STRUCTURE', icon: ChevronRight, color: 'text-cyan-400', border: 'border-cyan-500/30', content: [
    'READY PHASE: Draw 1 card, pick & roll a Gig Die from the Fixer Area, ready all spent cards.',
    'PLAY PHASE: Sell cards for Eddies, Call Legends, play Units/Gear/Programs from hand.',
    'ATTACK PHASE: Send ready Units to attack spent rival Units or attack directly to steal Gigs.',
  ]},
  { title: 'ECONOMY (EDDIES)', icon: Coins, color: 'text-yellow-400', border: 'border-yellow-500/30', content: [
    'Sell 1 card from your hand per turn (must have €$ tag) to create 1 Eddie.',
    'Spend Eddies (turn sideways) to pay card costs.',
    'Legends (face-up or face-down) can be spent as 1 Eddie each.',
    'Call a Legend by spending 2 Eddies to flip it face-up (once per turn).',
  ]},
  { title: 'CARD TYPES', icon: Zap, color: 'text-violet-400', border: 'border-violet-500/30', content: [
    "UNITS: Deploy to the field. Can't attack the turn they're played (unless GO SOLO).",
    'LEGENDS: Start face-down. Pay 2€$ to Call (reveal). Can be spent as Eddies.',
    'GEAR: Equip to Units for stat boosts and effects. Goes to trash with the Unit.',
    'PROGRAMS: One-time effects. Played and immediately discarded.',
  ]},
  { title: 'COMBAT', icon: Swords, color: 'text-red-400', border: 'border-red-500/30', content: [
    'Attack spent rival Units: Compare Power. Higher Power wins. Ties destroy both.',
    'Attack rival directly: Steal 1 Gig Die. Units with 10+ Power steal 2 Gigs.',
    'BLOCKER: A ready unit with Blocker can intercept attacks on you.',
    'After attacking, the Unit becomes spent (exhausted).',
  ]},
  { title: 'KEYWORDS', icon: Shield, color: 'text-blue-400', border: 'border-blue-500/30', content: [
    "BLOCKER: When rival attacks you, spend this Unit to redirect the attack to it.",
    "GO SOLO: This Unit can attack the same turn it's played.",
    "STREET CRED (★): The total of all your Gig Dice values. Some effects require certain Street Cred.",
  ]},
];

export default function Home() {
  const navigate = useNavigate();

  const [showLoadDeck, setShowLoadDeck] = useState(false);
  const [deckLoaded, setDeckLoaded] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem('cpTCG_deck') || 'null');
      return d && d.legends?.length === 3;
    } catch { return false; }
  });
  const [loadedDeckName, setLoadedDeckName] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem('cpTCG_deck') || 'null');
      return d?.name || null;
    } catch { return null; }
  });

  const handleDeckLoaded = (deck) => {
    setDeckLoaded(true);
    setLoadedDeckName(deck.name);
  };

  const startQuickplay = () => {
    localStorage.setItem("cpTCG_aiDifficulty", "medium");
    navigate("/game?mode=ai");
  };

<<<<<<< HEAD
  return (
  <div
    className="min-h-screen bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage:
        "linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.35)), url('/background.webp')",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed"
    }}
  >
    <div
  className="min-h-screen overflow-x-hidden overflow-y-auto"
=======
  
return (
  <div
    className="min-h-screen bg-no-repeat"
    style={{
      backgroundImage:
        "linear-gradient(rgba(0,0,0,.20), rgba(0,0,0,.45)), url('/background.webp')",
      backgroundSize: "cover",
backgroundPosition: "center top",
      backgroundAttachment: "fixed"
    }}
  >
    {/* HERO BANNER */}
<div
  className="absolute z-30 select-none"
>>>>>>> 346984b (initial commit)
  style={{
    left: "25px",   // move left / right
    top: "25px",     // move up / down
    transform: "scale(1.0)" // increase size here
  }}
>
  <div className="leading-none uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,.8)]">

    {/* TOP TEXT */}
    <h1
      style={{
        fontFamily: "Impact, Orbitron, sans-serif",
        fontSize: "50px",
        fontWeight: "900",
        lineHeight: ".95",
        letterSpacing: "1px",
        background:
          "linear-gradient(to bottom, #ffffff 0%, #d9d9d9 45%, #8e8e8e 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textShadow:
          "0 2px 0 rgba(0,0,0,.55), 0 0 10px rgba(255,255,255,.08)",
        filter: "contrast(1.15)"
      }}
    >
      BUILD YOUR CREW.
    </h1>

    {/* BOTTOM TEXT */}
    <h1
      style={{
        marginTop: "6px",
        fontFamily: "Impact, Orbitron, sans-serif",
        fontSize: "50px",
        fontWeight: "900",
        lineHeight: ".95",
        letterSpacing: "1px",
        background:
          "linear-gradient(to bottom, #ff6464 0%, #ff2323 35%, #d10000 70%, #6f0000 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textShadow:
          "0 2px 0 rgba(0,0,0,.65), 0 0 12px rgba(255,0,0,.18)",
        filter: "contrast(1.2)"
      }}
    >
      OWN NIGHT CITY.
    </h1>

    {/* WEATHERED OVERLAY */}
    <div
      className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
      style={{
        background:
          "repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,.15) 7px 8px, transparent 9px 14px)"
      }}
    />
  </div>
</div>


      <div className="relative z-20 flex flex-col items-center w-full px-4 py-6 gap-6">

       
      {/* Card Showcase */}
      
<div
  id="dragCards"
  className="absolute z-20 select-none"
  style={{
    left: "80px",
    top: "325px",
  }}
>

<div className="relative w-[360px] sm:w-[460px] h-[210px] sm:h-[280px] mx-auto">

  {/* LEFT CARD */}
  <div
    className="absolute left-0 sm:left-6 top-8 sm:top-10 rotate-[-14deg] z-10 transition-all duration-300 hover:-translate-y-2 hover:scale-105"
  >
    <div className="w-24 h-36 sm:w-32 sm:h-48 rounded-xl border-2 border-rose-500/60 relative overflow-hidden shadow-2xl">
      <img
        src="https://exburst.dev/cyberpunk/cards/hd/697107581860bf853828ac16_a026.webp"
        alt="Kiroshi Optics"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      <div className="absolute bottom-0 inset-x-0 p-1 text-center">
        <p className="font-orbitron text-[8px] sm:text-[10px] font-bold text-white">
          Kiroshi Optics
        </p>
        <p className="text-[7px] sm:text-[8px] text-rose-400 font-mono">
          GEAR
        </p>
      </div>
    </div>
  </div>

  {/* CENTER CARD */}
  <div
    className="absolute left-[105px] sm:left-[155px] top-0 z-30 transition-all duration-300 hover:-translate-y-2 hover:scale-105"
  >
    <div className="w-28 h-40 sm:w-36 sm:h-52 rounded-xl border-2 border-amber-500/60 relative overflow-hidden shadow-2xl">
      <img
        src="https://exburst.dev/cyberpunk/cards/hd/n001_1773925986628.webp"
        alt="Lucy Kushinada"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      <div className="absolute bottom-0 inset-x-0 p-1 text-center">
        <p className="font-orbitron text-[8px] sm:text-[10px] font-bold text-white">
          Lucy Kushinada
        </p>
        <p className="text-[7px] sm:text-[8px] text-amber-400 font-mono">
          LEGEND
        </p>
      </div>
    </div>
  </div>

  {/* RIGHT CARD */}
  <div
    className="absolute right-0 sm:right-6 top-8 sm:top-10 rotate-[14deg] z-20 transition-all duration-300 hover:-translate-y-2 hover:scale-105"
  >
    <div className="w-24 h-36 sm:w-32 sm:h-48 rounded-xl border-2 border-cyan-500/60 relative overflow-hidden shadow-2xl">
      <img
        src="https://exburst.dev/cyberpunk/cards/hd/HDev-srW8AEOtTs_fx_1773657698631.webp"
        alt="V (Streetkid)"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      <div className="absolute bottom-0 inset-x-0 p-1 text-center">
        <p className="font-orbitron text-[8px] sm:text-[10px] font-bold text-white">
          V (Streetkid)
        </p>
        <p className="text-[7px] sm:text-[8px] text-cyan-400 font-mono">
          LEGEND
        </p>
      </div>
    </div>
  </div>

</div>
</div>

        {/* Main Panel */}x``
<div
  className="w-full max-w-sm bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden relative"
  style={{
    left: "180px",
    top: "45x`px"
  }}
>
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

    <Link to="/rules" className="block">
  <button className="w-full h-11 flex items-center justify-center gap-3 rounded-xl font-rajdhani font-semibold text-sm tracking-wider transition-all duration-200 bg-muted/30 border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
    <FileText className="w-4 h-4" />
    Rules
  </button>
</Link>

  </div>

  <p className="py-3 text-[10px] text-muted-foreground/40 font-mono text-center border-t border-border/20">
    Fan-made simulator · Not affiliated with CD Projekt Red
  </p>

</div>

     </div>   

      {showLoadDeck && (
        <LoadDeckModal
          onClose={() => setShowLoadDeck(false)}
          onLoad={(deck) => {
            localStorage.setItem('cpTCG_deck', JSON.stringify(deck));
            handleDeckLoaded(deck);
          }}
        />
      )}
    </div>
  );
}

