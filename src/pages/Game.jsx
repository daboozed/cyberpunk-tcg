import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchCards } from "../data/cardService";
import { base44 } from "@/api/base44Client";
import { resolveEffect } from "@/lib/effectResolver";
import GameModals from "@/components/game/GameModals";
import {
  createInitialState,
  setupGame,
  mulligan,
  readyPhase,
  pickGigDie,
  sellCard,
  callLegend,
  playCard,
  resolvePendingEffect,
  startAttackPhase,
  attackUnit,
  attackRival,
  endTurn,
  resolveBlockerDecision,
  resolveAfterpartyAdjustment,
  playLegendAsSolo,
  resolveGigSteal,
  resolveGigBoost,
  PHASES
} from "@/lib/engine/gameEngine";
import {
  getAvailableEddies,
  getAvailableLegendEddies,
  getUnitPower
} from "@/lib/engine/EconomyEngine";
import { buildCustomDeck, GIG_DICE, CARD_BACK } from "@/lib/cardPool";
import FloorItModal from "@/components/game/FloorItModal";
import PlayerArea from "@/components/game/PlayerArea";
import HandArea from "@/components/game/HandArea";
import GameLog from "@/components/game/GameLog";
import CardDetailModal from "@/components/game/CardDetailModal";
import BlockerDecisionModal from "@/components/game/BlockerDecisionModal";
import AdjustGigModal from "@/components/game/AdjustGigModal";
import CardHoverPreview from "@/components/game/CardHoverPreview";
import GigStealModal from "@/components/game/GigStealModal";
import ChooseGigModal from "@/components/game/ChooseGigModal";
import { Swords, Crown, HelpCircle, LogOut, Loader2, Home } from "lucide-react";
import { Link } from "react-router-dom";

function cleanGigs(gigs) {
  return (gigs || []).filter(g => g && g.id && g.sides);
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem('cpTCG_playerId');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
    localStorage.setItem('cpTCG_playerId', id);
  }
  return id;
}

function flipState(gs) {
  const flipped = { ...gs, player: gs.opponent, opponent: gs.player };
  if (flipped.winner === 'player') flipped.winner = 'opponent';
  else if (flipped.winner === 'opponent') flipped.winner = 'player';
  return flipped;
}

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

export default function Game() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  const isMultiplayer = !!roomId;
  const actionBtn = `
  px-6 py-2 rounded-md font-orbitron text-sm tracking-wide
  transition-all duration-150
  border
  active:scale-95
`;
const attackBtn = `
  bg-red-600 text-white border-red-400
  shadow-[0_4px_0_rgb(120,0,0)]
  hover:bg-red-500
  active:translate-y-[2px] active:shadow-none
`;
  
const endTurnBtn = `
  bg-cyan-500 text-black border-cyan-300
  shadow-[0_4px_0_rgb(0,120,120)]
  hover:bg-cyan-400
  active:translate-y-[2px] active:shadow-none

`;

const passBtn = `
  bg-gray-600 text-white border-gray-300
  shadow-[0_4px_0_rgb(75,85,99)]
  hover:bg-gray-500
  active:translate-y-[2px] active:shadow-none
`;

  const [cards, setCards] = useState([]);
  const [cardMap, setCardMap] = useState({});
  const [gs, setGs] = useState(() => createInitialState());

window.gs = gs;
window.setGs = setGs;

  const [actualIndex, setactualIndex] = useState(null);
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [hoveredViktorCard, setHoveredViktorCard] = useState(null);
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [gearTarget, setGearTarget] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [rolledThisTurn, setRolledThisTurn] = useState(false);
  const [showAdjustGigModal, setShowAdjustGigModal] = useState(false);
  const [mulliganPreview, setMulliganPreview] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pendingGigBoost, setPendingGigBoost] = useState(null);
  const [pendingProgram, setPendingProgram] = useState(null);
  const [showFloorItModal, setShowFloorItModal] = useState(false);
  const [floorItCardIndex, setFloorItCardIndex] = useState(null);
  const [peekedLegend, setPeekedLegend] = useState(null);
  const [peekIndex, setPeekIndex] = useState(null);

  // 🔥 LOAD CARD DATA FROM API
useEffect(() => {
  fetchCards().then(cards => {
    console.log("LOADED CARDS:", cards);

    setCards(cards);

    const map = Object.fromEntries(
  cards.map(c => [c.name.toLowerCase(), c])
);
    setCardMap(map);
  });
}, []);

  // Multiplayer state
  const isGameOver = gs.phase === PHASES.GAME_OVER;
  const disableActions = isMultiplayer && waitingForOpponent;
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [mpSetupDone, setMpSetupDone] = useState(false);
  const [myPlayerLabel, setMyPlayerLabel] = useState('Player 1');
  const [oppPlayerLabel, setOppPlayerLabel] = useState('Player 2');
  const myRoleRef = useRef(null);
  const roomEntityIdRef = useRef(null);
  const unsubRef = useRef(null);

  // Single-player game setup
  useEffect(() => {
  if (!isMultiplayer && gs.phase === PHASES.SETUP && Object.keys(cardMap).length > 0) {

    try {
      const savedDeck = JSON.parse(localStorage.getItem('cpTCG_deck') || 'null');

      const playerDeckData = savedDeck || {
        legends: ['l0', 'l4', 'l3'],
        mainDeck: [
          { id: 'g1', count: 3 }, { id: 'g5', count: 2 }, { id: 'g2', count: 2 },
          { id: 'p3', count: 3 }, { id: 'p7', count: 3 },
          { id: 'u2', count: 3 }, { id: 'u5', count: 2 }, { id: 'u1', count: 3 },
          { id: 'u8', count: 3 }, { id: 'u9', count: 2 }, { id: 'u6', count: 1 },
        ]
      };

      const opponentDeckData = {
        legends: ['l11', 'l12', 'l7'],
        mainDeck: [
          { id: 'g3', count: 3 }, { id: 'g4', count: 2 }, { id: 'g6', count: 2 },
          { id: 'p2', count: 3 }, { id: 'p1', count: 3 },
          { id: 'u10', count: 3 }, { id: 'u15', count: 2 }, { id: 'u16', count: 3 },
          { id: 'u3', count: 3 }, { id: 'u7', count: 2 }, { id: 'u4', count: 1 },
        ]
      };

      // 🔥 Inject API data into player deck
const pd = buildCustomDeck(
  playerDeckData.legends,
  playerDeckData.mainDeck.map(c => ({
    ...c,
    apiData: cardMap[c.name?.toLowerCase()]
  })),
  0
);

// 🔥 Inject API data into opponent deck
const od = buildCustomDeck(
  opponentDeckData.legends,
  opponentDeckData.mainDeck.map(c => ({
    ...c,
    apiData: cardMap[c.name?.toLowerCase()]
  })),
  1
);

      // IMPORTANT: pass decks into createInitialState
      const initial = createInitialState(pd, od);

      setGs(setupGame(initial));

    } catch (e) {
      console.error("Deck load error", e);
    }
  }
}, [cardMap]);
  
  // Multiplayer setup
  useEffect(() => {
    if (!isMultiplayer) return;

    const setup = async () => {
      const myId = getOrCreatePlayerId();
      roomEntityIdRef.current = roomId;

      const rooms = await base44.entities.Room.filter({ id: roomId });
      if (!rooms || rooms.length === 0) { navigate('/'); return; }
      const room = rooms[0];

      const role = room.player1_id === myId ? 'player1' : 'player2';
      myRoleRef.current = role;
      setMyPlayerLabel(role === 'player1' ? 'Player 1' : 'Player 2');
      setOppPlayerLabel(role === 'player1' ? 'Player 2' : 'Player 1');

      if (room.game_state) {
        let loadedGs = JSON.parse(room.game_state);
        if (role === 'player2') loadedGs = flipState(loadedGs);
        setWaitingForOpponent(loadedGs.whose_turn !== role);
        setGs(loadedGs);
      } else if (role === 'player1') {
        // Player 1 initializes game state
        const hostDeckData = JSON.parse(room.host_deck || 'null');
        const guestDeckData = JSON.parse(room.guest_deck || 'null');

        let newGs = createInitialState();
        if (hostDeckData && guestDeckData) {
          const pd = buildCustomDeck(hostDeckData.legends, hostDeckData.mainDeck, 0);
          const od = buildCustomDeck(guestDeckData.legends, guestDeckData.mainDeck, 1);
          newGs.player = makePlayerState(pd, 'player');
          newGs.opponent = makePlayerState(od, 'opponent');
        }
        newGs.isMultiplayer = true;
        newGs = setupGame(newGs);
        // Auto-skip mulligan
        newGs = mulligan(newGs, false);
        newGs.whose_turn = newGs.currentPlayer === 'player' ? 'player1' : 'player2';
        setWaitingForOpponent(newGs.whose_turn !== 'player1');

console.log("FINAL STATE GIGS:", newGs.player.gigDice.map(g => ({
  id: g.id,
  value: g.value
})));

        setGs(newGs);
        await base44.entities.Room.update(roomId, { game_state: JSON.stringify(newGs) });
      } else {
        // Player 2 waits for player 1 to initialize
        setWaitingForOpponent(true);
      }

      // Subscribe to room updates
      const unsub = base44.entities.Room.subscribe(event => {
        if (event.id !== roomId) return;
        if (!event.data?.game_state) return;
        const latestGs = JSON.parse(event.data.game_state);
        const isMyTurn = latestGs.whose_turn === myRoleRef.current;
        if (isMyTurn || latestGs.phase === PHASES.GAME_OVER) {
          let displayGs = myRoleRef.current === 'player2' ? flipState(latestGs) : latestGs;
          setGs(displayGs);
          setWaitingForOpponent(false);
        }
      });
      unsubRef.current = unsub;
      setMpSetupDone(true);
    };

    setup();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const saveStateToRoom = useCallback(async (localGs) => {
    if (!roomEntityIdRef.current) return;
    const role = myRoleRef.current;
    const canonical = role === 'player2' ? flipState(localGs) : { ...localGs };
    await base44.entities.Room.update(roomEntityIdRef.current, { game_state: JSON.stringify(canonical) });
  }, []);

  const mpSave = useCallback((newGs, switchTurn = false) => {
    if (!isMultiplayer) return;
    let forSave = myRoleRef.current === 'player2' ? flipState(newGs) : { ...newGs };
    if (switchTurn) {
      forSave.whose_turn = myRoleRef.current === 'player1' ? 'player2' : 'player1';
    }
    base44.entities.Room.update(roomEntityIdRef.current, { game_state: JSON.stringify(forSave) });
  }, [isMultiplayer]);

  // Ready phase auto-trigger (only when it's my turn in multiplayer)
  useEffect(() => {
  if (gs.phase === PHASES.READY && (!isMultiplayer || !waitingForOpponent)) {

    setRolledThisTurn(false); // 🔥 ADD THIS LINE

    const timer = setTimeout(() => setGs(prev => readyPhase(prev)), 600);
    return () => clearTimeout(timer);
  }
}, [gs.phase, gs.turn, waitingForOpponent]);


  // Auto-skip mulligan in multiplayer (player2 side)
  useEffect(() => {
    if (gs.phase === PHASES.MULLIGAN && isMultiplayer && myRoleRef.current === 'player2') {
      const newGs = mulligan(gs, false);
      setGs(newGs);
    }
  }, [gs.phase]);

  const handleMulligan = useCallback((doIt) => {
    const newGs = mulligan(gs, doIt);
    setGs(newGs);
  }, [gs]);

  const handlePickGig = (player, index, result = null) => {
  if (rolledThisTurn) {
    console.log("ROLL BLOCKED: already rolled this turn");
    return;
  }

  const side = player === "opponent" ? gs.opponent : gs.player;
const die = side?.fixerArea?.[index];

  console.log("TARGET DIE:", die);

  if (!die) return;

  const finalRoll =
    result ?? Math.floor(Math.random() * die.sides) + 1;

  const newGs = pickGigDie(
    gs,
    index,
    finalRoll,
    player === "opponent" ? "opponent" : "player"
  );

  console.log("NEW VALUE:", newGs[player].gigDice[index]);

  setGs(newGs);
  setRolledThisTurn(true);

  if (isMultiplayer) mpSave(newGs);
};

  const handleCardClick = useCallback((index) => {
    if (gs.phase === PHASES.PLAY) {
      setactualIndex(prev => prev === index ? null : index);
      setSelectedAttacker(null);
    }
  }, [gs.phase]);

  const handleSellCard = useCallback((index) => {
  if (index === null || index === undefined) return;

  const card = gs.player.hand[index];

  // 🔥 HARD BLOCK — ONLY SELL IF EXPLICITLY ALLOWED
  if (!card || card.sellable !== true) return;

  const newGs = sellCard(gs, index);
  setGs(newGs);

  if (isMultiplayer) mpSave(newGs);

}, [gs, isMultiplayer, mpSave]);

  const handlePlayCard = useCallback((index) => {
  if (index === null || index === undefined) return;

  const card = gs.player.hand[index];
  const effect = card.apiData?.effect;
    
  if (!card) return;

    console.log("CARD PLAYED:", card);
    console.log("API DATA:", card.apiData);

  // GEAR
  if (card.type === 'gear') {
    if (gs.player.field.length === 0) {
      setGs(prev => ({ ...prev, message: 'No units on the field to equip Gear to!' }));
      return;
    }
    setGearTarget(index);
    setGs(prev => ({ ...prev, message: 'Select a friendly unit to equip this Gear to.' }));
    return;
  }

  // PROGRAMS
  if (card.type === "program" && card.id === "p1") {
  // TOGGLE OFF if already targeting
  if (pendingProgram?.targetType === "friendlyUnit") {
    setPendingProgram(null);
    return;
  }

  // TOGGLE ON
  setPendingProgram({
    card,
    cardIndex: index,
    targetType: "friendlyUnit"
  });

  return;
}

   if (card.type === 'program' && card.id === 'p2') {
    const friendlySpent = gs.player.field.filter(u => u.spent && (u.cost || 0) <= 4);
    const rivalSpent = gs.opponent.field.filter(u => u.spent && (u.cost || 0) <= 4);
    if (friendlySpent.length === 0 && rivalSpent.length === 0) return;

    setFloorItCardIndex(index);
    setShowFloorItModal(true);
    return;
  }

  if (card.type === 'program' && card.id === 'p3') {
    if (gs.player.gigDice.length === 0) return;
    setPendingProgram({ card, cardIndex: index, effect: 'p3' });
    return;
  }

  if (card.type === 'program' && card.id === 'p4') {
    setPendingProgram({ card, cardIndex: index, effect: 'p4' });
    return;
  }

  if (card.type === 'program' && card.id === 'p5') {
    setPendingProgram({ card, cardIndex: index, targetType: 'unit' });
    return;
  }

  if (card.type === 'program' && card.id === 'p7') {
    const targets = gs.opponent.field.filter(u => !u.spent && (u.cost || 0) <= 3);
    if (targets.length === 0) return;
    setPendingProgram({
  card,
  cardIndex: index,
  targetType: "enemyUnit"
});
    return;
  }

  // DEFAULT PLAY
  const newGs = playCard(gs, index);
  setGs(newGs);
  setactualIndex(null);

  if (isMultiplayer) mpSave(newGs);

}, [gs, pendingProgram, isMultiplayer, mpSave]);

  const handleCallLegend = useCallback((index) => {
  if (gs.phase !== PHASES.PLAY) return;

  const selectedLegend = gs.player.legends[index];
  if (!selectedLegend) return;

  if (
    selectedLegend.faceUp &&
    selectedLegend.keywords?.includes("goSolo")
  ) {
    const newGs = playLegendAsSolo(gs, index);
    setGs(newGs);

    if (isMultiplayer) mpSave(newGs);
    return;
  }

  const newGs = callLegend(gs, index);
  setGs(newGs);

  if (isMultiplayer) mpSave(newGs);
}, [gs, isMultiplayer, mpSave]);

  // Find callable solo legend
  const callableSoloLegend = gs.phase === PHASES.PLAY ? gs.player.legends.findIndex(l => 
    l.faceUp && l.keywords?.includes('goSolo') && !l.spent && 
    (getAvailableEddies(gs.player) + getAvailableLegendEddies(gs.player)) >= (l.cost || 0)
  ) : -1;
  const canCallSolo = callableSoloLegend !== -1 && !disableActions;

  const handleFieldUnitClick = useCallback((unit) => {
  // Gear targeting
  if (gearTarget !== null && gs.phase === PHASES.PLAY) {
    const newGs = playCard(gs, gearTarget, unit.uid);
    setGs(newGs);
    setGearTarget(null);
    setactualIndex(null);
    setSelectedAttacker(null);

    if (isMultiplayer) mpSave(newGs);
    return;
  }

  // Friendly unit targeting
  if (pendingProgram?.targetType === "friendlyUnit") {
  const newGs = structuredClone(gs);
  const p = newGs.player;
  const card = p.hand[pendingProgram.cardIndex];

  if (card?.effectData) {
    resolveEffect(card.effectData, {
      state: newGs,
      player: "player",
      targetUid: unit.uid
    });
  }

  const [removed] = p.hand.splice(pendingProgram.cardIndex, 1);
  p.trash.push(removed);

  setGs(newGs);
  setPendingProgram(null);
  setactualIndex(null);
  setSelectedAttacker(null);

  if (isMultiplayer) mpSave(newGs);
  return;
}

  // ATTACK PHASE: select one of your ready units as the attacker
if (gs.phase === PHASES.ATTACK) {
  if (!unit || unit.spent || unit.justPlayed || unit.cantAttack) return;

  setSelectedAttacker(prev =>
    prev === unit.uid ? null : unit.uid
  );

  setactualIndex(null);
  return;
}

// Default: clear selection outside attack flow
setSelectedAttacker(null);
setactualIndex(null);
  }, [gs, gearTarget, pendingProgram, isMultiplayer, mpSave]);

  const handleOpponentFieldClick = useCallback((unit) => {

  // 🔥 CORPORATE SURVEILLANCE / TARGETED PROGRAMS
  if (pendingProgram) {
    const card = pendingProgram.card;

    // p7 = Corporate Surveillance
    if (
      card?.id === "p7" &&
      !unit.spent &&
      (unit.cost || 0) <= 3
    ) {
      const newGs = resolvePendingEffect(gs, unit.uid);

      setGs(newGs);
      setPendingProgram(null);
      setSelectedAttacker(null);

      if (isMultiplayer) mpSave(newGs);
      return;
    }
  }

  // NORMAL ATTACK FLOW
  if (gs.phase === PHASES.ATTACK && selectedAttacker && unit.spent) {
    const newGs = attackUnit(gs, selectedAttacker, unit.uid);

    setGs(newGs);
    setSelectedAttacker(null);

    if (isMultiplayer) mpSave(newGs);

  } else {
    setDetailCard(unit);
  }

}, [
  gs,
  pendingProgram,
  selectedAttacker,
  isMultiplayer,
  mpSave
]);

const handleAttackGig = useCallback((gigIndex) => {
  if (gs.phase !== PHASES.ATTACK) return;
  if (!selectedAttacker) return;

  const gig = gs.opponent.gigDice?.[gigIndex];
  if (!gig?.id) return;

  const newGs = resolveGigSteal(gs, selectedAttacker, gig.id);

  setGs(newGs);
  setSelectedAttacker(null);

  if (isMultiplayer) mpSave(newGs);

}, [gs, selectedAttacker, isMultiplayer, mpSave]);

  const handleStartAttack = useCallback(() => {
    const newGs = startAttackPhase(gs);
    setGs(newGs);
    setactualIndex(null);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleEndTurn = useCallback(() => {
    setactualIndex(null);
    setSelectedAttacker(null);
    setGearTarget(null);
    setRolledThisTurn(false);
    
    if (!isMultiplayer && gs.currentPlayer === "player") {    setGs(prev => ({     ...prev,     message: "Opponent is thinking..."   }));    // Step 1: switch turn first   setTimeout(() => {     const passTurn = {       ...gs,       currentPlayer: "opponent"     };      setGs(passTurn);      // Step 2: let AI act after render     setTimeout(() => {       const aiState = readyPhase(passTurn);        setGs({         ...aiState,         message: "Opponent finished their turn."       });      }, 900);    }, 500);    return; }
  setGs(prev => ({
    ...prev,
    message: "Opponent is thinking..."
  }));

  setTimeout(() => {
  const newGs = endTurn(gs);

  setGs({
    ...newGs,
    message: "Opponent finished their turn."
  });
}, 1200);

  return;
}

const newGs = endTurn(gs);
setGs(newGs);
    if (isMultiplayer) {
      let forSave = myRoleRef.current === 'player2' ? flipState(newGs) : { ...newGs };
      forSave.whose_turn = myRoleRef.current === 'player1' ? 'player2' : 'player1';
      base44.entities.Room.update(roomEntityIdRef.current, { game_state: JSON.stringify(forSave) });
      setWaitingForOpponent(true);
    }
  }, [gs, isMultiplayer]);

  const handleBlockerDecision = useCallback((blockerUid) => {
    const newGs = resolveBlockerDecision(gs, blockerUid);
    setGs(newGs);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleAdjustGig = useCallback((gigIndex, adjustment) => {
    setGs(prev => {
      const updated = { ...prev };
      resolveAfterpartyAdjustment(updated, gigIndex, adjustment);
      const program = updated.player.hand.find(c => c.id === 'p4');
      if (program) {
        updated.player.hand = updated.player.hand.filter(c => c.id !== 'p4');
        updated.player.trash.push(program);
      }
      if (isMultiplayer) mpSave(updated);
      return updated;
    });
    setShowAdjustGigModal(false);
  }, [isMultiplayer, mpSave]);

  const handleLegendPeekClose = useCallback(() => {
  setPeekedLegend(null);
  setPeekIndex(null);

  setGs(prev => ({
    ...prev,
    pendingLegendPeek: false
  }));
}, []);

  const handleGigSteal = useCallback((gigId) => {
  if (!gs.pendingGigSteal) return;

  const attackerUid = gs.pendingGigSteal.attackerUid;

  const newGs = resolveGigSteal(gs, attackerUid, gigId);

  setGs(newGs);

  if (isMultiplayer) mpSave(newGs);
}, [gs, isMultiplayer, mpSave]);

  const handleGigBoost = useCallback((gigId) => {
    const newGs = resolveGigBoost(gs, gigId);
    setGs(newGs);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleDebugIncreaseAllGigs = useCallback(() => {
  setGs(prev => {
    const updated = structuredClone(prev);

    updated.player.gigDice = (updated.player.gigDice || []).map(gig => ({
      ...gig,
      value: Math.min(gig.sides, (gig.value || 0) + 1)
    }));

    console.log("DEBUG BOOST:", updated.player.gigDice);

    return updated;
  });
}, []);

  const handleLegendPeek = useCallback((index) => {
  if (peekIndex !== null) return;

  const owner = gs.pendingLegendPeek?.owner || "player";

  if (owner !== "player") return;

  const selectedLegend =
    owner === "player"
      ? gs.player?.legends?.[index]
      : gs.opponent?.legends?.[index];
  if (!selectedLegend) return;

  setPeekIndex(index);
  setPeekedLegend(selectedLegend);
}, [gs, peekIndex]);

  const handleNewGame = useCallback(() => {
  setactualIndex(null);
  setSelectedAttacker(null);
  setGearTarget(null);

  const savedDeck = JSON.parse(localStorage.getItem('cpTCG_deck') || 'null');

  const pd = buildCustomDeck(savedDeck.legends, savedDeck.mainDeck, 0);
  const od = buildCustomDeck(['l11','l12','l7'], [
    { id:'g3',count:3 },{ id:'g4',count:2 },{ id:'g6',count:2 },
    { id:'p2',count:3 },{ id:'p1',count:3 },
    { id:'u10',count:3 },{ id:'u15',count:2 },{ id:'u16',count:3 },
    { id:'u3',count:3 },{ id:'u7',count:2 },{ id:'u4',count:1 }
  ],1);

  const fresh = createInitialState(pd, od);
  setGs(setupGame(fresh));
}, []);

  const handleLeaveRoom = () => navigate('/');

  const canSell = actualIndex !== null && gs.player?.hand[actualIndex]?.sellable && !gs.soldThisTurn;
  const canPlay = actualIndex !== null && gs.player?.hand[actualIndex] &&
    (getAvailableEddies(gs.player) + getAvailableLegendEddies(gs.player)) >= (gs.player.hand[actualIndex]?.cost || 0);
const canStartAttack = gs.phase === PHASES.PLAY;

// 🔥 PHASE BUTTON LOGIC
let phaseButtonLabel = "ATTACK PHASE";
let phaseButtonDisabled = false;
let phaseButtonStyle = attackBtn;

// READY PHASE → yellow glowing (unclickable)
if (gs.phase === PHASES.READY || gs.phase === PHASES.PICK_GIG) {
  phaseButtonLabel = "PLAY PHASE";
  phaseButtonDisabled = true;
  phaseButtonStyle = `
  bg-yellow-500 text-black border-yellow-300
  shadow-[0_0_12px_rgba(255,255,0,0.8)]
  animate-pulse [animation-duration:2s]
`;
}

// PLAY PHASE → red glowing (clickable)
if (gs.phase === PHASES.PLAY) {
  phaseButtonLabel = "ATTACK PHASE";
  phaseButtonDisabled = false;
  phaseButtonStyle = attackBtn;
}

// ATTACK PHASE → greyed out (locked)
if (gs.phase === PHASES.ATTACK) {
  phaseButtonLabel = "ATTACK PHASE";
  phaseButtonDisabled = true;
  phaseButtonStyle = `
    bg-gray-600 text-gray-300 border-gray-500
    opacity-50 cursor-not-allowed
  `;
}


  // Derive context-sensitive message instead of using gs.message
  function getDerivedMessage() {
    if (disableActions) return "Waiting for opponent's move...";
    if (isGameOver) return gs.message || (gs.winner === 'player' ? 'You win!' : 'Defeat.');
    if (gearTarget !== null) return 'Select a friendly unit to equip this Gear to.';
    if (gs.awaitingTarget) return 'Select a target to apply the effect.';
    if (gs.phase === PHASES.PICK_GIG) return 'Pick a Fixer Die to roll your Gig.';
    if (gs.phase === PHASES.PLAY) {
      if (selectedAttacker) return 'Attacker selected — go to Attack Phase to attack, or deselect.';
      if (actualIndex !== null) {
        const card = gs.player?.hand[actualIndex];
        if (card) {
          if (!canPlay) return `Not enough Eddies to play ${card.name} (costs ${card.cost || 0}).`;
          return `Play ${card.name}${canSell ? ' or sell it for €$1.' : '.'}`;
        }
      }
      return 'Play cards, sell for Eddies, or move to Attack Phase.';
    }
    if (gs.phase === PHASES.ATTACK) {
      if (selectedAttacker) return 'Attack a spent rival unit, or attack rival directly to steal a Gig.';
      return 'Select one of your units to attack with, or end your turn.';
    }
    if (gs.phase === PHASES.MULLIGAN) return 'Mulligan your hand or keep it.';
    if (gs.phase === PHASES.READY) return 'Ready phase — preparing your turn...';
    return '';
  }

  console.log("PLAYER FIELD:", gs.player.field);
console.log("OPP FIELD:", gs.opponent.field);
console.log("SAME ARRAY?", gs.player.field === gs.opponent.field);
console.log("SAME PLAYER OBJ?", gs.player === gs.opponent);

return (
<div className="min-h-screen w-screen flex flex-col relative overflow-y-auto scanlines" style={{ background: '#020d18' }}>
  {/* Grid background */}
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: 'linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '40px 40px'
  }} />
  {/* Glow orb */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,255,255,0.06) 0%, transparent 70%)' }} />
      {/* Top bar */}
      {/* Top bar */}
<div
  className="flex justify-end px-[clamp(8px,1vw,20px)] py-1 relative z-10"
  style={{
  background: 'rgba(0,10,20,0.95)'
}}
>
  <div className="flex items-center gap-1">
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setShowRules(!showRules)}
      style={{ color: '#00ffff' }}
    >
      <HelpCircle className="w-4 h-4" />
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={() => setShowCombatLog(prev => !prev)}
      className="font-rajdhani text-xs"
      style={{ color: '#00ffff' }}
    >
      Combat Log
    </Button>

    <Button
      size="sm"
      variant="ghost"
      onClick={handleLeaveRoom}
      className="gap-1 font-rajdhani text-xs"
      style={{ color: '#ff3366' }}
    >
      <LogOut className="w-4 h-4" /> Leave
    </Button>
  </div>
</div>

      {/* Winner overlay */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center space-y-4 p-8">
            <Crown className={cn("w-16 h-16 mx-auto", gs.winner === 'player' ? "text-accent" : "text-destructive")} />
            <h2 className={cn("font-orbitron text-3xl md:text-5xl font-black tracking-wider", gs.winner === 'player' ? "text-accent" : "text-destructive")}>
              {gs.winner === 'player' ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="text-foreground/70 font-rajdhani text-lg">{gs.message}</p>
            <div className="flex gap-3 justify-center mt-4">
              {!isMultiplayer && (
                <Button onClick={handleNewGame} className="font-orbitron bg-primary text-primary-foreground hover:bg-primary/80">
                  New Game
                </Button>
              )}
              <Button onClick={() => navigate('/')} variant="outline" className="font-orbitron gap-2 border-muted-foreground/40 text-muted-foreground hover:text-foreground">
                <Home className="w-4 h-4" /> Lobby
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for opponent overlay */}
      {isMultiplayer && waitingForOpponent && !isGameOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
          <div className="bg-card border border-primary/40 rounded-xl p-8 text-center shadow-2xl pointer-events-auto">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="font-orbitron text-primary tracking-wider">Waiting for opponent...</p>
            <p className="font-rajdhani text-muted-foreground text-sm mt-1">
              {myRoleRef.current === 'player1' ? "Player 2's turn" : "Player 1's turn"}
            </p>
          </div>
        </div>
      )}

      {/* Mulligan dialog (single player only) */}
      {gs.phase === PHASES.MULLIGAN && !isMultiplayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 mx-4 text-center space-y-4 max-w-4xl w-full">
            <h2 className="font-orbitron text-xl font-bold text-primary">MULLIGAN?</h2>
            <p className="text-sm font-rajdhani text-foreground/70">Shuffle your hand back and draw 6 new cards?</p>
            <div className="flex gap-3 justify-center overflow-x-auto pb-2" onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}>
              {(gs.player.hand || []).filter(Boolean).map((card) => (
                <div key={card.uid} onMouseEnter={() => setMulliganPreview(card)} onMouseLeave={() => setMulliganPreview(null)}
                  className={cn("relative w-28 h-40 rounded-xl border-2 overflow-hidden flex-shrink-0 cursor-pointer transition-all hover:scale-105",
                    card.type === 'unit' ? 'border-cyan-500/60' : card.type === 'program' ? 'border-violet-500/60' : card.type === 'gear' ? 'border-rose-500/60' : 'border-amber-500/60')}>
                  {card.imageUrl ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
                  <div className="absolute bottom-0 inset-x-0 p-1.5">
                    <p className="text-[9px] font-rajdhani font-bold text-white text-center leading-tight">{card.name}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => handleMulligan(true)} variant="outline" className="font-rajdhani border-secondary text-secondary hover:bg-secondary/10">Mulligan</Button>
              <Button onClick={() => handleMulligan(false)} className="font-rajdhani bg-primary text-primary-foreground">Keep Hand</Button>
            </div>
          </div>
          {mulliganPreview && <CardHoverPreview card={mulliganPreview} mousePos={mousePos} />}
        </div>
      )}

      {/* Rules panel */}
      {showRules && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowRules(false)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-orbitron text-lg font-bold text-primary mb-3">HOW TO PLAY</h2>
            <div className="space-y-3 text-xs font-rajdhani text-foreground/80">
              <div><h3 className="text-sm font-bold text-cyan-400">WIN CONDITION</h3><p>Start your turn with 6+ Gig Dice to win. In Overtime, first to 7 Gigs wins instantly.</p></div>
              <div><h3 className="text-sm font-bold text-cyan-400">TURN PHASES</h3>
                <p><strong className="text-green-400">Ready:</strong> Draw a card, pick & roll a Gig Die, ready all spent cards.</p>
                <p><strong className="text-green-400">Play:</strong> Sell cards for Eddies, Call Legends (2€$), play Units/Gear/Programs.</p>
                <p><strong className="text-green-400">Attack:</strong> Attack spent rival units or attack rival directly (steal Gigs).</p>
              </div>
              <div><h3 className="text-sm font-bold text-cyan-400">COMBAT</h3>
                <p>Units can only attack spent rival units. Higher power wins.</p>
                <p>Attack rival directly to steal their Gig Dice. Choose which Gig to steal!</p>
                <p>Units with 10+ Power steal 2 Gigs instead of 1.</p>
              </div>
            </div>
            <Button onClick={() => setShowRules(false)} className="mt-4 w-full font-rajdhani" variant="outline">Close</Button>
          </div>
        </div>
      )}

      {/* Main game area */}
        <div className="flex flex-col items-center relative z-10 w-full flex-1">

  {/* PLAYER 2 (TOP) */}
  <div className="w-full max-w-[1200px]">
   
   <PlayerArea
      player={gs.opponent}
      rolledThisTurn={rolledThisTurn}
      isOpponent
      phase={gs.phase}
      selectedAttacker={selectedAttacker}
      onFieldUnitClick={handleOpponentFieldClick}
      onAttackGig={handleAttackGig}
      onRollGig={handlePickGig}
      
    />

  </div>

  {/* PLAYER 1 BOARD */}

  <div className="w-full max-w-[1200px] flex justify-center mt-12">
    
    <PlayerArea
      player={gs.player}
      phase={gs.phase}
      pendingProgram={pendingProgram}
      rolledThisTurn={rolledThisTurn}
      onLegendClick={!disableActions ? handleCallLegend : () => {}}
      onFieldUnitClick={!disableActions ? handleFieldUnitClick : () => {}}
      onFixerDieClick={!disableActions ? handlePickGig : () => {}}
      onRollGig={handlePickGig}
      disableDice={rolledThisTurn || gs.phase !== PHASES.PICK_GIG}
      selectedAttacker={selectedAttacker}
      playerLabel={isMultiplayer ? myPlayerLabel : "Player 1"}
      pendingBlock={gs.pendingBlock}
      onBlock={handleBlockerDecision}
    />
  </div>

  {/* HAND (ALWAYS BELOW BOARD) */}
  <div className="w-full max-w-[1200px] mt-2">

  {/* ACTION BUTTONS */}
  <div className="flex gap-4 justify-center mt-4">
    <button
  className={cn(actionBtn, phaseButtonStyle)}
  onClick={handleStartAttack}
  disabled={phaseButtonDisabled}
>
  {phaseButtonLabel}
</button>

{gs.pendingBlock && (
  <button
    className={cn(actionBtn, passBtn)}
    onClick={() => handleBlockerDecision(null)}
  >
    PASS
  </button>
)}

    <button
      className={cn(actionBtn, endTurnBtn)}
      onClick={handleEndTurn}
      disabled={!!gs.pendingBlock}
    >
      END TURN
    </button>

<button
  className="px-6 py-2 rounded-md border border-green-400 text-green-300 bg-black hover:bg-green-900"
  onClick={handleDebugIncreaseAllGigs}
>
  +1 ALL GIGS
</button>

  </div>

  {/* HAND */}
  <HandArea
    onPlayCard={handlePlayCard}
    onSellCard={handleSellCard}
    hand={gs.player.hand}
    onCardClick={!disableActions ? handleCardClick : () => {}}
    actualIndex={actualIndex}
    phase={gs.phase}
    availableEddies={
      getAvailableEddies(gs.player) +
      getAvailableLegendEddies(gs.player)
    }
  />
</div>

  {/* COMBAT LOG */}
 {showCombatLog && (
  <div className="absolute right-0 top-0 h-full w-[320px] border-l border-cyan-500 bg-black/90">

    <GameLog
      logs={gs.gameLog}
      alwaysExpanded
      cardLookup={cardMap}
      extraHeaderRight={
        <button
          onClick={() => {
            const text = (gs.gameLog || [])
              .map(entry =>
                typeof entry === "string"
                  ? entry
                  : entry.msg || ""
              )
              .join("\n");

            navigator.clipboard.writeText(text);
          }}
          className="text-xs px-2 py-1 border border-cyan-400 rounded hover:bg-cyan-500/20"
        >
          Copy
        </button>
      }
    />
  </div>
)}
   </div>
      <GameModals
  gs={gs}
  detailCard={detailCard}
  setDetailCard={setDetailCard}
  handleBlockerDecision={handleBlockerDecision}
  handleAdjustGig={handleAdjustGig}
  handleGigSteal={handleGigSteal}
  handleLegendPeek={handleLegendPeek}
  handleLegendPeekClose={handleLegendPeekClose}
  peekIndex={peekIndex}
  pendingProgram={pendingProgram}
  setPendingProgram={setPendingProgram}
  setGs={setGs}
  floorItCardIndex={floorItCardIndex}
  setFloorItCardIndex={setFloorItCardIndex}
  showFloorItModal={showFloorItModal}
  setShowFloorItModal={setShowFloorItModal}
  hoveredViktorCard={hoveredViktorCard}
  setHoveredViktorCard={setHoveredViktorCard}
  mousePos={mousePos}
  isMultiplayer={isMultiplayer}
  mpSave={mpSave}
  setactualIndex={setactualIndex}
/>

    </div>
  );
}
