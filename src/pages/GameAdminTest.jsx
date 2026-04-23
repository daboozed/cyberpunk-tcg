import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createInitialState,
  setupGame,
  startAttackPhase,
  attackUnit,
  attackRival,
  endTurn,
  playLegendAsSolo,
  resolveGigSteal,
  PHASES,
  getAvailableEddies,
  getAvailableLegendEddies,
  getUnitPower,
} from "@/lib/gameEngine";
import { buildCustomDeck, GIG_DICE, LEGENDS_POOL, UNITS_POOL, PROGRAMS_POOL, GEAR_POOL } from "@/lib/cardPool";
import { ProgramResolver } from "@/lib/programResolver";

const ALL_CARDS = [...UNITS_POOL, ...PROGRAMS_POOL, ...GEAR_POOL];

function getRandomCard() {
  return ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
}
import PhaseIndicator from "@/components/game/PhaseIndicator";
import PlayerArea from "@/components/game/PlayerArea";
import HandArea from "@/components/game/HandArea";
import GameLog from "@/components/game/GameLog";
import CardDetailModal from "@/components/game/CardDetailModal";
import CardHoverPreview from "@/components/game/CardHoverPreview";
import GigStealModal from "@/components/game/GigStealModal";
import FloorItModal from "@/components/game/FloorItModal";
import { Swords, HelpCircle, LogOut, Home, Trash2 } from "lucide-react";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePlayerState(deck, owner) {
  return {
    legends: shuffle([...deck.legends]),
    deck: shuffle([...deck.mainDeck]),
    hand: [],
    field: [],
    eddies: [],
    trash: [],
    gigDice: [],
    fixerArea: GIG_DICE.map((d, i) => ({ ...d, id: `${owner}_die_${i}` })),
    streetCred: 0,
  };
}

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function GameAdminTest() {
  const navigate = useNavigate();

  const [gs, setGs] = useState(() => createInitialState());
  const [history, setHistory] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [showCardAdd, setShowCardAdd] = useState(false);
  const [cardAddTarget, setCardAddTarget] = useState('player'); // 'player' or 'opponent'
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [trashLegend, setTrashLegend] = useState(null);
  const [gearMode, setGearMode] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedOpponentUnit, setSelectedOpponentUnit] = useState(null);
  const [pendingProgram, setPendingProgram] = useState(null);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [modalDrag, setModalDrag] = useState(null);
  const [showFloorItModal, setShowFloorItModal] = useState(false);
  const [floorItCardIndex, setFloorItCardIndex] = useState(null);

  // Single-player game setup
  useEffect(() => {
    if (gs.phase === PHASES.SETUP) {
      let newGs = { ...gs };
      const playerDeckData = {
        legends: ["l0", "l4", "l3"],
        mainDeck: [
          { id: "g1", count: 3 },
          { id: "g5", count: 2 },
          { id: "g2", count: 2 },
          { id: "p3", count: 3 },
          { id: "p7", count: 3 },
          { id: "u2", count: 3 },
          { id: "u5", count: 2 },
          { id: "u1", count: 3 },
          { id: "u8", count: 3 },
          { id: "u9", count: 2 },
          { id: "u6", count: 1 },
        ],
      };
      const opponentDeckData = {
        legends: ["l11", "l12", "l7"],
        mainDeck: [
          { id: "g3", count: 3 },
          { id: "g4", count: 2 },
          { id: "g6", count: 2 },
          { id: "p2", count: 3 },
          { id: "p1", count: 3 },
          { id: "u10", count: 3 },
          { id: "u15", count: 2 },
          { id: "u16", count: 3 },
          { id: "u3", count: 3 },
          { id: "u7", count: 2 },
          { id: "u4", count: 1 },
        ],
      };
      const pd = buildCustomDeck(playerDeckData.legends, playerDeckData.mainDeck, 0);
      const od = buildCustomDeck(opponentDeckData.legends, opponentDeckData.mainDeck, 1);
      newGs.player = makePlayerState(pd, "player");
      newGs.opponent = makePlayerState(od, "opponent");
      newGs = setupGame(newGs);
      // Clear both boards for admin test
      newGs.player.legends = [];
      newGs.player.field = [];
      newGs.player.hand = [];
      newGs.player.eddies = [];
      newGs.player.gigDice = [];
      newGs.opponent.legends = [];
      newGs.opponent.field = [];
      newGs.opponent.hand = [];
      newGs.opponent.eddies = [];
      newGs.opponent.gigDice = [];
      newGs.phase = PHASES.PLAY;
      newGs.currentPlayer = "player";
      setGs(newGs);
    }
  }, []);

  // Skip turns (no AI)
  const handleEndTurn = useCallback(() => {
    setSelectedCard(null);
    setSelectedAttacker(null);
    setGs((prev) => {
      let newGs = { ...prev };
      newGs.currentPlayer = newGs.currentPlayer === "player" ? "opponent" : "player";
      newGs.phase = PHASES.PLAY;
      // Reset spent cards
      newGs.player.field.forEach((u) => (u.spent = false));
      newGs.opponent.field.forEach((u) => (u.spent = false));
      return newGs;
    });
  }, []);

  const allCards = [
    ...LEGENDS_POOL.map((c) => ({ ...c, type: "legend" })),
    ...UNITS_POOL.map((c) => ({ ...c, type: "unit" })),
    ...PROGRAMS_POOL.map((c) => ({ ...c, type: "program" })),
    ...GEAR_POOL.map((c) => ({ ...c, type: "gear" })),
  ];

  const filteredCards = allCards.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCard = useCallback((card) => {
    if (card.type === "legend") {
      setSelectedPlacement({ card, type: "legend", target: cardAddTarget });
    } else {
      setSelectedPlacement({ card, type: card.type, target: cardAddTarget });
    }
  }, [cardAddTarget]);

  const handleConfirmPlacement = useCallback(
    (placement) => {
      if (!selectedPlacement) return;
      const { card, target } = selectedPlacement;
      const p = target === 'player' ? 'player' : 'opponent';

      setGs((prev) => {
        setHistory(h => [...h.slice(-4), { ...prev }]);
        const newGs = { ...prev };
        const player = newGs[p];
        
        if (placement === "legend") {
          if (player.legends.length < 3) {
            player.legends.push({ ...card, uid: uid(), faceUp: true, spent: false });
          }
        } else if (placement === "field") {
          player.field.push({ ...card, uid: uid(), spent: false, justPlayed: false });
        } else if (placement === "hand") {
          player.hand.push({ ...card, uid: uid() });
        } else if (placement === "eddies") {
          player.eddies.push({ uid: uid(), spent: false });
        } else if (placement === "trash") {
          player.trash.push(card);
        }
        return newGs;
      });
      setSelectedPlacement(null);
      setShowCardAdd(false);
    },
    [selectedPlacement]
  );

  const handleTrashLegend = useCallback((legendIndex) => {
    setGs((prev) => {
      const newGs = { ...prev };
      const [legend] = newGs.player.legends.splice(legendIndex, 1);
      newGs.player.trash.push(legend);
      return newGs;
    });
    setTrashLegend(null);
  }, []);

  const handleFieldUnitClick = useCallback((unit) => {
    setSelectedUnit((prev) => (prev === unit.uid ? null : unit.uid));
  }, []);

  const handleOpponentFieldUnitClick = useCallback((unit) => {
    setSelectedOpponentUnit((prev) => (prev === unit.uid ? null : unit.uid));
  }, []);

  const handleOpponentFieldClickDetail = useCallback((unit) => {
    if (gs.phase === PHASES.ATTACK && selectedAttacker && unit.spent) {
      setGs((prev) => {
        const newGs = { ...prev };
        const attacker = newGs.player.field.find((u) => u.uid === selectedAttacker);
        const defender = newGs.opponent.field.find((u) => u.uid === unit.uid);
        if (!attacker || !defender) return newGs;

        const atkPow =
          (attacker.power || 0) +
          (attacker.powerBonus || 0) +
          ((attacker.gear || []).reduce((sum, g) => sum + (g.powerBonus || 0), 0));
        const defPow =
          (defender.power || 0) +
          (defender.powerBonus || 0) +
          ((defender.gear || []).reduce((sum, g) => sum + (g.powerBonus || 0), 0));

        attacker.spent = true;

        if (atkPow >= defPow) {
          const idx = newGs.opponent.field.findIndex((u) => u.uid === unit.uid);
          if (idx >= 0) {
            const [d] = newGs.opponent.field.splice(idx, 1);
            newGs.opponent.trash.push(d);
          }
        } else {
          const idx = newGs.player.field.findIndex((u) => u.uid === selectedAttacker);
          if (idx >= 0) {
            const [d] = newGs.player.field.splice(idx, 1);
            newGs.player.trash.push(d);
          }
        }

        setSelectedAttacker(null);
        return newGs;
      });
    }
  }, [gs.phase, selectedAttacker]);

  const handleOpponentFieldClick = useCallback((unit) => {
    if (gs.phase === PHASES.ATTACK && selectedAttacker && unit.spent) {
      setGs((prev) => {
        const newGs = { ...prev };
        const attacker = newGs.player.field.find((u) => u.uid === selectedAttacker);
        const defender = newGs.opponent.field.find((u) => u.uid === unit.uid);
        if (!attacker || !defender) return newGs;

        const atkPow =
          (attacker.power || 0) +
          (attacker.powerBonus || 0) +
          ((attacker.gear || []).reduce((sum, g) => sum + (g.powerBonus || 0), 0));
        const defPow =
          (defender.power || 0) +
          (defender.powerBonus || 0) +
          ((defender.gear || []).reduce((sum, g) => sum + (g.powerBonus || 0), 0));

        attacker.spent = true;

        if (atkPow >= defPow) {
          const idx = newGs.opponent.field.findIndex((u) => u.uid === unit.uid);
          if (idx >= 0) {
            const [d] = newGs.opponent.field.splice(idx, 1);
            newGs.opponent.trash.push(d);
          }
        } else {
          const idx = newGs.player.field.findIndex((u) => u.uid === selectedAttacker);
          if (idx >= 0) {
            const [d] = newGs.player.field.splice(idx, 1);
            newGs.player.trash.push(d);
          }
        }

        setSelectedAttacker(null);
        return newGs;
      });
    } else {
      setDetailCard(unit);
    }
  }, [gs.phase, selectedAttacker]);

  const handleAttackRival = useCallback(() => {
    if (selectedAttacker && gs.opponent.gigDice.length > 0) {
      setGs((prev) => {
        const newGs = { ...prev };
        const attacker = newGs.player.field.find((u) => u.uid === selectedAttacker);
        if (!attacker) return newGs;

        attacker.spent = true;
        const gigIdx = newGs.opponent.gigDice.reduce(
          (best, g, i) =>
            g.value > newGs.opponent.gigDice[best].value ? i : best,
          0
        );
        const [stolen] = newGs.opponent.gigDice.splice(gigIdx, 1);
        newGs.player.gigDice.push({ ...stolen, id: uid() });

        setSelectedAttacker(null);
        return newGs;
      });
    }
  }, [selectedAttacker, gs.opponent.gigDice.length]);

  const handleStartAttack = useCallback(() => {
    setGs((prev) => {
      let newGs = { ...prev };
      newGs.phase = PHASES.ATTACK;
      return newGs;
    });
  }, []);

  const handleCardClick = useCallback((index) => {
    setSelectedCard(prev => prev === index ? null : index);
  }, []);

  const handlePlayCard = useCallback((index) => {
    if (index === null || index === undefined) return;
    const card = gs.player.hand[index];
    if (!card) return;

    // If it's Floor It (p2), show modal to select unit
    if (card.type === 'program' && card.id === 'p2') {
      setFloorItCardIndex(index);
      setShowFloorItModal(true);
      return;
    }

    // If it's a program that needs gig selection (p3, p4), show modal
    if (card.type === 'program' && (card.id === 'p3' || card.id === 'p4')) {
      setPendingProgram({ cardIndex: index, card });
      return;
    }

    // If it's a program that targets a friendly unit (p1, p5), check if player has units
    if (card.type === 'program' && ['p1', 'p5'].includes(card.id)) {
      if (gs.player.field.length === 0) {
        alert(`${card.name} requires a friendly unit on the field`);
        return;
      }
      // Use first unit as target
      setPendingProgram({ cardIndex: index, card, targetType: 'unit' });
      return;
    }

    // If it's Corporate Surveillance (p7), show modal if more than 1 eligible target
    if (card.type === 'program' && card.id === 'p7') {
      const validTargets = gs.opponent.field.filter(u => (u.cost || 0) <= 3);
      if (validTargets.length > 1) {
        setPendingProgram({ cardIndex: index, card });
        return;
      } else if (validTargets.length === 1) {
        // Auto-resolve: spend the only eligible unit
        setGs(prev => {
          const newGs = { ...prev };
          newGs.opponent.field.find(u => (u.cost || 0) <= 3).spent = true;
          const p = newGs.player;
          p.hand.splice(index, 1);
          p.trash.push(card);
          return newGs;
        });
        setSelectedCard(null);
        return;
      }
    }

    setGs(prev => {
      setHistory(h => [...h.slice(-4), { ...prev }]);
      const newGs = { ...prev };
      const p = newGs.player;
      p.hand.splice(index, 1);
      
      if (card.type === 'program') {
        const resolved = ProgramResolver.resolveProgram(newGs, card.id);
        p.trash.push(card);
        return resolved;
      } else if (card.type === 'unit') {
        p.field.push({ ...card, uid: uid(), spent: false, justPlayed: false });
      } else if (card.type === 'gear' && p.field.length > 0) {
        p.field[0].gear = (p.field[0].gear || []);
        p.field[0].gear.push({ ...card, uid: uid() });
      }
      return newGs;
    });
    setSelectedCard(null);
  }, [gs.player.hand]);

  const handleSelectGigForProgram = useCallback((gigId) => {
    if (!pendingProgram) return;
    const { card } = pendingProgram;
    
    setGs(prev => {
      const newGs = { ...prev };
      const p = newGs.player;
      const target = p.gigDice.find(g => g.id === gigId);
      if (target) {
        const resolved = ProgramResolver.resolveProgram(newGs, card.id, gigId);
        p.hand.splice(pendingProgram.cardIndex, 1);
        p.trash.push(card);
        return resolved;
      }
      return newGs;
    });
    setPendingProgram(null);
    setSelectedCard(null);
  }, [pendingProgram]);

  const handleAddDeck = useCallback(() => {
    setGs(prev => {
      const newGs = { ...prev };
      newGs.player.deck.push({ ...getRandomCard(), uid: uid() });
      return newGs;
    });
  }, []);

  const handleRemoveDeck = useCallback(() => {
    setGs(prev => {
      const newGs = { ...prev };
      if (newGs.player.deck.length > 0) newGs.player.deck.pop();
      return newGs;
    });
  }, []);

  const handleAddTrash = useCallback(() => {
    setGs(prev => {
      const newGs = { ...prev };
      newGs.player.trash.push(getRandomCard());
      return newGs;
    });
  }, []);

  const handleRemoveTrash = useCallback(() => {
    setGs(prev => {
      const newGs = { ...prev };
      if (newGs.player.trash.length > 0) newGs.player.trash.pop();
      return newGs;
    });
  }, []);

  const handleToggleUnitSpent = useCallback(() => {
    if (!selectedUnit) return;
    setGs((prev) => {
      const newGs = { ...prev };
      const unit = newGs.player.field.find((u) => u.uid === selectedUnit);
      if (unit) unit.spent = !unit.spent;
      return newGs;
    });
  }, [selectedUnit]);

  const handleToggleOpponentUnitSpent = useCallback(() => {
    if (!selectedOpponentUnit) return;
    setGs((prev) => {
      const newGs = { ...prev };
      const unit = newGs.opponent.field.find((u) => u.uid === selectedOpponentUnit);
      if (unit) unit.spent = !unit.spent;
      return newGs;
    });
  }, [selectedOpponentUnit]);

  const handleAddGearToUnit = useCallback((gear) => {
    if (!selectedUnit) return;
    setGs((prev) => {
      const newGs = { ...prev };
      const unit = newGs.player.field.find((u) => u.uid === selectedUnit);
      if (unit) {
        if (!unit.gear) unit.gear = [];
        unit.gear.push({ ...gear, uid: uid() });
      }
      return newGs;
    });
    setGearMode(false);
  }, [selectedUnit]);

  const handleLegendClick = useCallback((side, legendIndex) => {
    setGs((prev) => {
      const newGs = { ...prev };
      const p = side === 'player' ? newGs.player : newGs.opponent;
      const legend = p.legends[legendIndex];
      if (!legend) return newGs;

      const hasGoSolo = legend.keywords?.includes('goSolo');
      const cost = legend.cost || 0;

      // If already faceUp and has GO SOLO, bring to field
      if (legend.faceUp && hasGoSolo && !legend.goSoloActive) {
        p.field.push({
          ...legend,
          uid: uid(),
          spent: false,
          isLegend: true,
        });
        legend.goSoloActive = true;
        newGs.gameLog.push({ msg: `${legend.name} (GO SOLO) enters field — costs €$${cost}`, time: Date.now() });
      } else {
        // Toggle faceUp
        legend.faceUp = !legend.faceUp;
        if (legend.faceUp) {
          newGs.gameLog.push({ msg: `Called Legend ${legend.name}`, time: Date.now() });
        }
      }
      return newGs;
    });
  }, []);

  const handleAddEddie = useCallback((side) => {
    setGs((prev) => {
      const newGs = { ...prev };
      const p = side === 'player' ? newGs.player : newGs.opponent;
      p.eddies.push({ uid: uid(), spent: false });
      return newGs;
    });
  }, []);

  const handleRemoveEddie = useCallback((side) => {
    setGs((prev) => {
      const newGs = { ...prev };
      const p = side === 'player' ? newGs.player : newGs.opponent;
      if (p.eddies.length > 0) p.eddies.pop();
      return newGs;
    });
  }, []);

  const handleAddCred = useCallback((side) => {
    setGs((prev) => {
      const newGs = { ...prev };
      const p = side === 'player' ? newGs.player : newGs.opponent;
      if (p.fixerArea.length > 0) {
        const die = p.fixerArea[0];
        p.gigDice.push({ id: uid(), ...die, value: Math.ceil(Math.random() * die.sides) });
        p.fixerArea.splice(0, 1);
      }
      return newGs;
    });
  }, []);

  const handleRemoveCred = useCallback((side) => {
    setGs((prev) => {
      const newGs = { ...prev };
      const p = side === 'player' ? newGs.player : newGs.opponent;
      if (p.gigDice.length > 0) {
        const [gig] = p.gigDice.splice(p.gigDice.length - 1, 1);
        p.fixerArea.push({ sides: gig.sides, label: gig.label, color: gig.color });
      }
      return newGs;
    });
  }, []);

  const handleFixerDieClick = useCallback((dieIndex, isGigClick = false, isOpponent = false) => {
    setGs((prev) => {
      const newGs = { ...prev };
      const p = isOpponent ? newGs.opponent : newGs.player;
      
      if (isGigClick) {
        // Return gig to available pool
        if (dieIndex >= 0 && dieIndex < p.gigDice.length) {
          const [gig] = p.gigDice.splice(dieIndex, 1);
          p.fixerArea.push({ sides: gig.sides, label: gig.label, color: gig.color });
        }
      } else {
        // Roll die from pool and add to gig area
        if (dieIndex >= 0 && dieIndex < p.fixerArea.length) {
          const die = p.fixerArea[dieIndex];
          p.gigDice.push({ id: uid(), ...die, value: Math.ceil(Math.random() * die.sides) });
          p.fixerArea.splice(dieIndex, 1);
        }
      }
      return newGs;
    });
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden scanlines"
      style={{ background: "#020d18" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,255,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 relative z-10"
        style={{
          background: "rgba(0,10,20,0.95)",
          borderBottom: "1px solid #00ffff",
          boxShadow: "0 0 20px rgba(0,255,255,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <h1
            className="font-orbitron text-sm md:text-base font-bold tracking-widest"
            style={{ color: "#00ffff", textShadow: "0 0 12px #00ffff" }}
          >
            ADMIN TEST
          </h1>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-1 font-rajdhani text-xs"
          style={{ color: "#ff3366" }}
        >
          <LogOut className="w-4 h-4" /> Leave
        </Button>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <PlayerArea
            player={gs.opponent}
            isOpponent
            phase={gs.phase}
            onFieldUnitClick={handleOpponentFieldUnitClick}
            onLegendClick={(i) => handleLegendClick('opponent', i)}
            onFixerDieClick={(i, isGig) => handleFixerDieClick(i, isGig, true)}
            playerLabel="Player 2"
          />

          <div className="flex items-center justify-center gap-3 px-4">
            <Button
              onClick={() => setTrashLegend(!trashLegend)}
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/50 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Trash Legend
            </Button>
            <Button
              onClick={() => { setShowCardAdd(!showCardAdd); setCardAddTarget('player'); }}
              className="bg-yellow-500/30 border border-yellow-400 text-yellow-300 hover:bg-yellow-500/40 font-rajdhani font-bold"
            >
              TEST CARDS P1
            </Button>
            <Button
              onClick={() => { setShowCardAdd(!showCardAdd); setCardAddTarget('opponent'); }}
              className="bg-purple-500/30 border border-purple-400 text-purple-300 hover:bg-purple-500/40 font-rajdhani font-bold"
            >
              TEST CARDS P2
            </Button>
            {selectedUnit && (
              <Button
                onClick={handleToggleUnitSpent}
                size="sm"
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                Toggle Spent (P1)
              </Button>
            )}
            {selectedOpponentUnit && (
              <Button
                onClick={handleToggleOpponentUnitSpent}
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Toggle Spent (P2)
              </Button>
            )}
            {selectedUnit && (
              <Button
                onClick={() => setGearMode(true)}
                size="sm"
                variant="outline"
                className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
              >
                Add Gear
              </Button>
            )}
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => handleAddEddie('opponent')} className="w-8 h-8 p-0">+</Button>
              <Button size="sm" variant="outline" onClick={() => handleRemoveEddie('opponent')} className="w-8 h-8 p-0">−</Button>
              <span className="text-xs text-muted-foreground">Eddie</span>
            </div>
          </div>

          <PlayerArea
            player={gs.player}
            phase={gs.phase}
            onFieldUnitClick={handleFieldUnitClick}
            onLegendClick={(i) => handleLegendClick('player', i)}
            onFixerDieClick={handleFixerDieClick}
            onAddDeck={handleAddDeck}
            onRemoveDeck={handleRemoveDeck}
            onAddTrash={handleAddTrash}
            onRemoveTrash={handleRemoveTrash}
            onAddEddie={() => handleAddEddie('player')}
            onRemoveEddie={() => handleRemoveEddie('player')}
            selectedAttacker={selectedAttacker}
            playerLabel="Player 1"
          />

          <HandArea
            hand={gs.player.hand}
            onCardClick={handleCardClick}
            selectedCard={selectedCard}
            phase={gs.phase}
            availableEddies={9999}
          />

          <div className="flex flex-wrap gap-2 justify-center px-3 py-2">
            <Button
              size="sm"
              onClick={handleStartAttack}
              className="gap-1.5 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-rajdhani text-xs"
            >
              <Swords className="w-3.5 h-3.5" />
              Attack Phase
            </Button>
            {selectedCard !== null && (
              <Button
                size="sm"
                onClick={() => handlePlayCard(selectedCard)}
                className="gap-1.5 bg-cyan-500/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 font-rajdhani text-xs"
              >
                Play Card
              </Button>
            )}

            {selectedAttacker && (
              <Button
                size="sm"
                onClick={handleAttackRival}
                className="gap-1.5 bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 font-rajdhani text-xs"
              >
                <Swords className="w-3.5 h-3.5" />
                Attack Rival
              </Button>
            )}
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => handleAddEddie('player')} className="w-8 h-8 p-0">+</Button>
              <Button size="sm" variant="outline" onClick={() => handleRemoveEddie('player')} className="w-8 h-8 p-0">−</Button>
              <span className="text-xs text-muted-foreground">Eddie</span>
            </div>

              <Button
              size="sm"
              variant="outline"
              onClick={handleEndTurn}
              className="gap-1.5 border-muted-foreground/30 text-muted-foreground hover:bg-muted font-rajdhani text-xs"
            >
              End Turn
            </Button>
          </div>
        </div>

        <div className="lg:w-64 flex-shrink-0 h-40 lg:h-auto">
          <GameLog logs={gs.gameLog} alwaysExpanded={false} />
        </div>
      </div>

      {/* Card Add Modal */}
      {showCardAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-primary rounded-xl p-4 max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="font-orbitron text-lg font-bold text-primary mb-3">
              ADD CARD
            </h2>
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded bg-muted border border-border text-foreground text-sm"
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleAddCard(card)}
                  className="w-full text-left p-2 rounded border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="font-rajdhani font-bold text-foreground">
                    {card.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {card.type} {card.power && `• ${card.power} PWR`}
                    {card.cost && ` • €$${card.cost}`}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => setShowCardAdd(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              {history.length > 0 && (
                <Button
                  onClick={() => { setGs(history[history.length - 1]); setHistory(h => h.slice(0, -1)); }}
                  variant="outline"
                  className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                >
                  Undo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Placement Selection */}
      {selectedPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-primary rounded-xl p-6 max-w-sm mx-4">
            <h2 className="font-orbitron text-lg font-bold text-primary mb-4">
              Place {selectedPlacement.card.name}
            </h2>
            <div className="space-y-2">
             {selectedPlacement.type === "legend" && (
               <Button
                 onClick={() => handleConfirmPlacement("legend")}
                 className="w-full bg-amber-500/30 border border-amber-400 text-amber-300 hover:bg-amber-500/40 font-rajdhani"
               >
                 Legend Area
               </Button>
             )}
             {["unit", "gear", "program"].includes(selectedPlacement.type) && (
               <>
                 <Button
                   onClick={() => handleConfirmPlacement("field")}
                   className="w-full bg-cyan-500/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 font-rajdhani"
                 >
                   Field
                 </Button>
                 <Button
                   onClick={() => handleConfirmPlacement("hand")}
                   className="w-full bg-violet-500/30 border border-violet-400 text-violet-300 hover:bg-violet-500/40 font-rajdhani"
                 >
                   Hand
                 </Button>
                 <Button
                   onClick={() => handleConfirmPlacement("eddies")}
                   className="w-full bg-green-500/30 border border-green-400 text-green-300 hover:bg-green-500/40 font-rajdhani"
                 >
                   Eddies
                 </Button>
               </>
             )}
             <Button
               onClick={() => handleConfirmPlacement("trash")}
               className="w-full bg-red-500/30 border border-red-400 text-red-300 hover:bg-red-500/40 font-rajdhani"
             >
               Trash
             </Button>
             <Button
               onClick={() => setSelectedPlacement(null)}
               variant="outline"
               className="w-full"
             >
               Cancel
             </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trash Legend Dropdown */}
      {trashLegend && (
        <div className="fixed top-20 left-4 z-20 bg-card border border-red-500/50 rounded p-2 w-48">
          {gs.player.legends.map((legend, i) => (
            <button
              key={i}
              onClick={() => {
                handleTrashLegend(i);
              }}
              className="w-full text-left p-2 text-sm hover:bg-muted rounded mb-1"
            >
              {legend.name}
            </button>
          ))}
        </div>
      )}

      <CardDetailModal
        card={detailCard}
        open={!!detailCard}
        onClose={() => setDetailCard(null)}
      />

      {/* Gear Add Modal */}
      {gearMode && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-rose-500 rounded-xl p-4 max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="font-orbitron text-lg font-bold text-rose-400 mb-3">
              SELECT GEAR
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {GEAR_POOL.map((gear) => (
                <button
                  key={gear.id}
                  onClick={() => handleAddGearToUnit(gear)}
                  className="w-full text-left p-2 rounded border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="font-rajdhani font-bold text-foreground">
                    {gear.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    +{gear.powerBonus || 0} PWR {gear.cost && `€$${gear.cost}`}
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setGearMode(false)}
              variant="outline"
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pendingProgram && (pendingProgram.card.id === 'p3' || pendingProgram.card.id === 'p4') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-cyan-500 rounded-xl p-4 max-w-md mx-4">
            {pendingProgram.card.id === 'p3' && (
              <>
                <h2 className="font-orbitron text-lg font-bold text-cyan-400 mb-4">
                  SELECT GIG TO INCREASE
                </h2>
                <p className="text-xs text-muted-foreground mb-3">Choose which Gig to give +4 value.</p>
                <div className="space-y-2 mb-4">
                  {gs.player.gigDice.map((gig) => (
                    <button
                      key={gig.id}
                      onClick={() => handleSelectGigForProgram(gig.id)}
                      className="w-full p-3 rounded border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-left"
                    >
                      <span className="font-rajdhani font-bold text-foreground">{gig.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">Current: {gig.value}★</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <Button
              onClick={() => setPendingProgram(null)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pendingProgram && pendingProgram.card.id === 'p4' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onMouseUp={() => setModalDrag(null)} onMouseLeave={() => setModalDrag(null)}>
          <div 
            className="bg-card border border-yellow-500 rounded-xl p-2.5 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto cursor-move"
            style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)` }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setModalDrag({ startX: e.clientX - modalPos.x, startY: e.clientY - modalPos.y });
              }
            }}
            onMouseMove={(e) => {
              if (modalDrag) {
                setModalPos({
                  x: e.clientX - modalDrag.startX,
                  y: e.clientY - modalDrag.startY
                });
              }
            }}
          >
            <h2 className="font-orbitron text-sm font-bold text-yellow-400 mb-1">
              AFTERPARTY AT LIZZIE'S
            </h2>
            <p className="text-[10px] text-muted-foreground mb-2.5">Adjust a rival gig value, then confirm.</p>
            
            <div className="mb-2.5">
              <div className="text-[10px] text-yellow-300 font-bold mb-1.5">RIVAL GIGS:</div>
              <div className="flex flex-wrap gap-1.5">
                {gs.opponent.gigDice.map((gig) => {
                  const isSelected = pendingProgram.selectedGig === gig.id;
                  const adjustment = isSelected ? (pendingProgram.adjustment || 0) : 0;
                  const newValue = Math.max(1, Math.min(gig.sides, gig.value + adjustment));
                  const matches = gs.player.gigDice.some(fg => fg.value === newValue);
                  
                  return (
                    <div key={gig.id} className={`p-1.5 rounded border transition-all ${
                      isSelected 
                        ? 'bg-yellow-500/15 border-yellow-400'
                        : 'bg-yellow-500/5 border-yellow-500/20'
                    }`}>
                      {isSelected ? (
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-rajdhani font-bold text-foreground text-xs">{gig.label}</span>
                            <span className="text-[9px] text-muted-foreground">{gig.value}★ → <span className={matches ? 'text-green-400 font-bold' : ''}>{newValue}★</span></span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => {
                                if (adjustment > -2) {
                                  setPendingProgram(prev => ({ ...prev, adjustment: (prev.adjustment || 0) - 1 }));
                                }
                              }}
                              disabled={adjustment <= -2}
                              className="w-5 h-5 rounded border border-yellow-400/50 hover:bg-yellow-500/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[10px] font-bold text-yellow-300"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-[10px] font-bold text-yellow-300">{adjustment >= 0 ? '+' : ''}{adjustment}</span>
                            <button
                              onClick={() => {
                                if (adjustment < 2) {
                                  setPendingProgram(prev => ({ ...prev, adjustment: (prev.adjustment || 0) + 1 }));
                                }
                              }}
                              disabled={adjustment >= 2}
                              className="w-5 h-5 rounded border border-yellow-400/50 hover:bg-yellow-500/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[10px] font-bold text-yellow-300"
                            >
                              +
                            </button>
                          </div>
                          {matches && (
                            <div className="mt-0.5 text-[9px] text-green-400 font-bold">✓ MATCH!</div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setPendingProgram(prev => ({ ...prev, selectedGig: gig.id, adjustment: 0 }))}
                          className="text-[9px] py-0.5 px-1 rounded border border-yellow-500/30 hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-300 transition-colors whitespace-nowrap"
                        >
                          {gig.label}: {gig.value}★
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mb-2.5 p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
              <div className="text-[10px] text-cyan-300 font-bold mb-1">YOUR GIGS:</div>
              <div className="space-y-0.5">
                {gs.player.gigDice.map((gig) => (
                  <div key={gig.id} className="text-[10px] font-rajdhani text-cyan-300">
                    {gig.label}: <span className="font-bold">{gig.value}★</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <Button
                onClick={() => {
                  setGs(prev => {
                    const newGs = { ...prev };
                    const opp = newGs.opponent;
                    const gig = opp.gigDice.find(g => g.id === pendingProgram.selectedGig);
                    if (gig) {
                      const adjustment = pendingProgram.adjustment || 0;
                      gig.value = Math.max(1, Math.min(gig.sides, gig.value + adjustment));
                    }
                    const p = newGs.player;
                    if (newGs.player.gigDice.some(fg => fg.value === gig.value)) {
                      if (p.deck.length > 0) p.hand.push(p.deck.pop());
                    }
                    p.hand.splice(pendingProgram.cardIndex, 1);
                    p.trash.push(pendingProgram.card);
                    return newGs;
                  });
                  setPendingProgram(null);
                  setSelectedCard(null);
                }}
                disabled={!pendingProgram.selectedGig}
                className="flex-1 bg-yellow-500/30 border border-yellow-400 text-yellow-300 hover:bg-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed font-rajdhani"
              >
                Confirm
              </Button>
              <Button
                onClick={() => setPendingProgram(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFloorItModal && (
        <FloorItModal
          friendlyUnits={gs.player.field.filter(u => u.spent && (u.cost || 0) <= 4)}
          rivalUnits={gs.opponent.field.filter(u => u.spent && (u.cost || 0) <= 4)}
          onSelect={(unit, owner) => {
            setGs(prev => {
              const newGs = { ...prev };
              const field = owner === 'player' ? newGs.player.field : newGs.opponent.field;
              const hand = owner === 'player' ? newGs.player.hand : newGs.opponent.hand;
              const idx = field.findIndex(u => u.uid === unit.uid);
              if (idx >= 0) {
                const [returned] = field.splice(idx, 1);
                hand.push(returned);
              }
              const p = newGs.player;
              p.hand.splice(floorItCardIndex, 1);
              p.trash.push(gs.player.hand[floorItCardIndex]);
              return newGs;
            });
            setShowFloorItModal(false);
            setFloorItCardIndex(null);
            setSelectedCard(null);
          }}
          onCancel={() => {
            setShowFloorItModal(false);
            setFloorItCardIndex(null);
          }}
        />
      )}

      {pendingProgram && pendingProgram.card.id === 'p1' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-violet-500 rounded-xl p-4 max-w-md mx-4">
            <h2 className="font-orbitron text-lg font-bold text-violet-400 mb-2">REBOOT OPTICS</h2>
            <p className="text-xs text-muted-foreground mb-4">Select a unit to buff +4 Power (defeated at end of turn).</p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {gs.player.field.length === 0 ? (
                <p className="text-xs text-muted-foreground">No units on field.</p>
              ) : (
                gs.player.field.map((unit) => (
                  <button
                    key={unit.uid}
                    onClick={() => {
                      setGs(prev => {
                        const newGs = { ...prev };
                        const target = newGs.player.field.find(u => u.uid === unit.uid);
                        if(target) {
                          target.powerBonus = (target.powerBonus || 0) + 4;
                          target.scheduledDefeat = 'endOfTurn';
                          const p = newGs.player;
                          p.hand.splice(pendingProgram.cardIndex, 1);
                          p.trash.push(pendingProgram.card);
                        }
                        return newGs;
                      });
                      setPendingProgram(null);
                      setSelectedCard(null);
                    }}
                    className="w-full p-2 rounded border border-violet-500/30 hover:bg-violet-500/20 text-left transition-colors text-sm"
                  >
                    <div className="font-rajdhani font-bold text-foreground">{unit.name}</div>
                    <div className="text-xs text-muted-foreground">Power: {(unit.power || 0) + (unit.powerBonus || 0)}</div>
                  </button>
                ))
              )}
            </div>
            <Button onClick={() => setPendingProgram(null)} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pendingProgram && pendingProgram.card.id === 'p7' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-green-500 rounded-xl p-4 max-w-md mx-4">
            <h2 className="font-orbitron text-lg font-bold text-green-400 mb-2">CORPORATE SURVEILLANCE</h2>
            <p className="text-xs text-muted-foreground mb-4">Select a rival unit (cost ≤3) to spend.</p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {gs.opponent.field
                .filter(u => !u.spent && (u.cost || 0) <= 3)
                .map((unit) => (
                  <button
                    key={unit.uid}
                    onClick={() => {
                      setGs(prev => {
                        const newGs = { ...prev };
                        const target = newGs.opponent.field.find(u => u.uid === unit.uid);
                        if(target) target.spent = true;
                        const p = newGs.player;
                        p.hand.splice(pendingProgram.cardIndex, 1);
                        p.trash.push(pendingProgram.card);
                        return newGs;
                      });
                      setPendingProgram(null);
                      setSelectedCard(null);
                    }}
                    className="w-full p-2 rounded border border-green-500/30 hover:bg-green-500/20 text-left transition-colors text-sm"
                  >
                    <div className="font-rajdhani font-bold text-foreground">{unit.name}</div>
                    <div className="text-xs text-muted-foreground">Cost: {unit.cost || 0} • Power: {unit.power || 0}</div>
                  </button>
                ))}
            </div>
            <Button onClick={() => setPendingProgram(null)} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pendingProgram && pendingProgram.targetType === 'unit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-violet-500 rounded-xl p-4 max-w-md mx-4">
            <h2 className="font-orbitron text-lg font-bold text-violet-400 mb-4">
              CONFIRM {pendingProgram.card.name.toUpperCase()}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">{pendingProgram.card.effect}</p>
            <div className="space-y-2 mb-4">
              {gs.player.field.map((unit) => (
                <div key={unit.uid} className="p-2 rounded border border-violet-500/30 bg-violet-500/5">
                  <div className="font-rajdhani font-bold text-foreground">{unit.name}</div>
                  <div className="text-xs text-muted-foreground">Power: {unit.power || 0}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setGs(prev => {
                    const newGs = { ...prev };
                    const p = newGs.player;
                    const resolved = ProgramResolver.resolveProgram(newGs, pendingProgram.card.id);
                    p.hand.splice(pendingProgram.cardIndex, 1);
                    p.trash.push(pendingProgram.card);
                    return resolved;
                  });
                  setPendingProgram(null);
                  setSelectedCard(null);
                }}
                className="flex-1 bg-violet-500/30 border border-violet-400 text-violet-300 hover:bg-violet-500/40 font-rajdhani"
              >
                Play
              </Button>
              <Button
                onClick={() => setPendingProgram(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}