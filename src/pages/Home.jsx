import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swords, Layers, FolderOpen, Cpu, Crown, ChevronRight, Coins, Zap, Shield } from "lucide-react";
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


  return (
  <div
  className="min-h-screen bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage:
      "linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.55)), url('/backround.webp')"
  }}
>

      <div className="relative z-20 flex flex-col items-center w-full px-4 py-6 gap-6">

        {/* Logo */}
        <div className="w-full max-w-xl flex flex-col items-center">
          <img
            src="https://i.imgur.com/MfLDoVA.png"
            alt="Neon City Duel"
            className="w-full object-contain"
            style={{ maxHeight: '180px' }}
          />
          <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mt-2" />
        </div>

        {/* Card Showcase */}
        <div className="flex gap-3 items-center justify-center flex-wrap">
          {[
            { name: 'Kiroshi Optics', type: 'GEAR', color: 'border-rose-500/60', accent: 'text-rose-400', img: 'https://exburst.dev/cyberpunk/cards/hd/697107581860bf853828ac16_a026.webp' },
            { name: 'Lucy Kushinada', type: 'LEGEND', color: 'border-amber-500/60', accent: 'text-amber-400', img: 'https://exburst.dev/cyberpunk/cards/hd/n001_1773925986628.webp' },
            { name: 'V (Streetkid)', type: 'LEGEND', color: 'border-cyan-500/60', accent: 'text-cyan-400', img: 'https://exburst.dev/cyberpunk/cards/hd/HDev-srW8AEOtTs_fx_1773657698631.webp' },
          ].map((card) => (
            <div key={card.name} className={`w-20 h-28 sm:w-28 sm:h-40 rounded-xl border-2 ${card.color} relative overflow-hidden flex-shrink-0`}>
              <img src={card.img} alt={card.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-0 inset-x-0 p-1.5 text-center">
                <p className="font-orbitron text-[7px] sm:text-[9px] font-bold text-white leading-tight">{card.name}</p>
                <p className={`text-[6px] sm:text-[7px] font-mono mt-0.5 ${card.accent}`}>{card.type}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Panel */}
        <div className="w-full max-w-sm bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="bg-muted/60 px-6 py-4 border-b border-border/40 text-center">
            <h2 className="font-orbitron text-base sm:text-lg font-bold text-foreground tracking-wider">ENTER NEON CITY</h2>
            <p className="font-rajdhani text-xs text-muted-foreground mt-0.5">Neon City Duel — Fan-made Simulator for the Cyberpunk TCG</p>
          </div>

          <div className="p-5 space-y-3">
            {deckLoaded && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs font-mono text-green-400 truncate">Deck loaded: {loadedDeckName || 'Custom Deck'}</span>
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
          </div>
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