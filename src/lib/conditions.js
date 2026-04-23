import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
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
  resolveAfterparyAdjustment,
  playLegendAsSolo,
  resolveGigSteal,
  resolveGigBoost,
  PHASES,
  getAvailableEddies,
  getAvailableLegendEddies,
  getUnitPower,
} from "@/lib/gameEngine";
import { buildCustomDeck, GIG_DICE } from "@/lib/cardPool";
import PhaseIndicator from "@/components/game/PhaseIndicator";
import PlayerArea from "@/components/game/PlayerArea";
import HandArea from "@/components/game/HandArea";
import ActionBar from "@/components/game/ActionBar";
import GameLog from "@/components/game/GameLog";
import CardDetailModal from "@/components/game/CardDetailModal";
import BlockerDecisionModal from "@/components/game/BlockerDecisionModal";
import AdjustGigModal from "@/components/game/AdjustGigModal";
import CardHoverPreview from "@/components/game/CardHoverPreview";
import GigStealModal from "@/components/game/GigStealModal";
import ChooseGigModal from "@/components/game/ChooseGigModal";
import { Swords, Crown, HelpCircle, LogOut, Loader2, Home } from "lucide-react";
import { Link } from "react-router-dom";

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

function makePlayerState(deck, owner) {
  return {
    legends: deck.legends,
    deck: deck.mainDeck,
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

  const [gs, setGs] = useState(() => createInitialState());
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [gearTarget, setGearTarget] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [showAdjustGigModal, setShowAdjustGigModal] = useState(false);
  const [mulliganPreview, setMulliganPreview] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pendingGigBoost, setPendingGigBoost] = useState(null);

  // Multiplayer state
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [mpSetupDone, setMpSetupDone] = useState(false);
  const [myPlayerLabel, setMyPlayerLabel] = useState('YOU');
  const [oppPlayerLabel, setOppPlayerLabel] = useState('RIVAL');
  const myRoleRef = useRef(null);
  const roomEntityIdRef = useRef(null);
  const unsubRef = useRef(null);

  // Single-player game setup
  useEffect(() => {
    if (!isMultiplayer && gs.phase === PHASES.SETUP) {
      let newGs = gs;
      try {
        const savedDeck = JSON.parse(localStorage.getItem('cpTCG_deck') || 'null');
        const playerDeckData = savedDeck || { legends: ['l0', 'l4', 'l3'], mainDeck: [
          { id: 'g1', count: 3 }, { id: 'g5', count: 2 }, { id: 'g2', count: 2 },
          { id: 'p3', count: 3 }, { id: 'p7', count: 3 },
          { id: 'u2', count: 3 }, { id: 'u5', count: 2 }, { id: 'u1', count: 3 },
          { id: 'u8', count: 3 }, { id: 'u9', count: 2 }, { id: 'u6', count: 1 },
        ]};
        const opponentDeckData = { legends: ['l11', 'l12', 'l7'], mainDeck: [
          { id: 'g3', count: 3 }, { id: 'g4', count: 2 }, { id: 'g6', count: 2 },
          { id: 'p2', count: 3 }, { id: 'p1', count: 3 },
          { id: 'u10', count: 3 }, { id: 'u15', count: 2 }, { id: 'u16', count: 3 },
          { id: 'u3', count: 3 }, { id: 'u7', count: 2 }, { id: 'u4', count: 1 },
        ]};
        const pd = buildCustomDeck(playerDeckData.legends, playerDeckData.mainDeck, 0);
        const od = buildCustomDeck(opponentDeckData.legends, opponentDeckData.mainDeck, 1);
        newGs = { ...gs };
        newGs.player = makePlayerState(pd, 'player');
        newGs.opponent = makePlayerState(od, 'opponent');
      } catch (e) {}
      setGs(setupGame(newGs));
    }
  }, []);

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
      setMyPlayerLabel(role === 'player1' ? 'Player 1 (You)' : 'Player 2 (You)');
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

  const handlePickGig = useCallback((dieIndex) => {
    const newGs = pickGigDie(gs, dieIndex);
    setGs(newGs);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleCardClick = useCallback((index) => {
    if (gs.phase === PHASES.PLAY) {
      setSelectedCard(prev => prev === index ? null : index);
      setSelectedAttacker(null);
    }
  }, [gs.phase]);

  const handleSellCard = useCallback(() => {
    if (selectedCard !== null) {
      const newGs = sellCard(gs, selectedCard);
      setGs(newGs);
      setSelectedCard(null);
      if (isMultiplayer) mpSave(newGs);
    }
  }, [selectedCard, gs, isMultiplayer, mpSave]);

  const handlePlayCard = useCallback(() => {
    if (selectedCard === null) return;
    const card = gs.player.hand[selectedCard];
    if (!card) return;

    if (card.type === 'gear') {
      if (gs.player.field.length === 0) {
        setGs(prev => ({ ...prev, message: 'No units on the field to equip Gear to!' }));
        return;
      }
      setGearTarget(selectedCard);
      setGs(prev => ({ ...prev, message: 'Select a friendly unit to equip this Gear to.' }));
      return;
    }

    if (card.type === 'program' && (card.id === 'p1' || card.id === 'p3')) {
      const rival = gs.opponent;
      const maxPower = card.id === 'p1' ? 3 : 4;
      const targets = rival.field.filter(u => getUnitPower(u) <= maxPower);
      const targetUid = targets.length > 0 ? targets[0].uid : null;
      const newGs = playCard(gs, selectedCard, targetUid);
      setGs(newGs);
      setSelectedCard(null);
      if (isMultiplayer) mpSave(newGs);
      return;
    }

    if (card.type === 'program' && (card.id === 'p5' || card.id === 'p7')) {
      if (gs.player.field.length > 0) {
        setGearTarget(selectedCard);
        setGs(prev => ({ ...prev, message: 'Select a friendly unit for this Program.' }));
        return;
      }
    }

   const newGs = playCard(gs, selectedCard);
setGs(newGs);

if (!newGs.awaitingTarget) {
  setSelectedCard(null);
}

if (isMultiplayer) mpSave(newGs);
  }, [selectedCard, gs, isMultiplayer, mpSave]);

  const handleCallLegend = useCallback((index) => {
    if (gs.phase !== PHASES.PLAY) return;
    const legend = gs.player.legends[index];
    if (!legend) return;
    if (legend.faceUp && legend.keywords?.includes('goSolo')) {
      const newGs = playLegendAsSolo(gs, index);
      setGs(newGs);
      if (isMultiplayer) mpSave(newGs);
      return;
    }
    const newGs = callLegend(gs, index);
    setGs(newGs);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleFieldUnitClick = useCallback((unit) => {
    if (gearTarget !== null && gs.phase === PHASES.PLAY) {
      const newGs = playCard(gs, gearTarget, unit.uid);
      setGs(newGs);
      setGearTarget(null);
      setSelectedCard(null);
      if (isMultiplayer) mpSave(newGs);
      return;
    }
    if (gs.phase === PHASES.ATTACK || gs.phase === PHASES.PLAY) {
      if (!unit.spent && !unit.justPlayed && !unit.cantAttack) {
        setSelectedAttacker(prev => prev === unit.uid ? null : unit.uid);
        setSelectedCard(null);
      }
    }
  }, [gs, gearTarget, isMultiplayer, mpSave]);

  const handleOpponentFieldClick = useCallback((unit) => {
    if (gs.phase === PHASES.ATTACK && selectedAttacker && unit.spent) {
      const newGs = attackUnit(gs, selectedAttacker, unit.uid);
      setGs(newGs);
      setSelectedAttacker(null);
      if (isMultiplayer) mpSave(newGs);
    } else {
      setDetailCard(unit);
    }
  }, [gs, selectedAttacker, isMultiplayer, mpSave]);

  const handleAttackRival = useCallback(() => {
    if (selectedAttacker) {
      const newGs = attackRival(gs, selectedAttacker);
      setGs(newGs);
      setSelectedAttacker(null);
      if (isMultiplayer) mpSave(newGs);
    }
  }, [selectedAttacker, gs, isMultiplayer, mpSave]);

  const handleStartAttack = useCallback(() => {
    const newGs = startAttackPhase(gs);
    setGs(newGs);
    setSelectedCard(null);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleEndTurn = useCallback(() => {
    setSelectedCard(null);
    setSelectedAttacker(null);
    setGearTarget(null);
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
      resolveAfterparyAdjustment(updated, gigIndex, adjustment);
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

  const handleGigSteal = useCallback((gigId) => {
    const newGs = resolveGigSteal(gs, gigId);
    setGs(newGs);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleGigBoost = useCallback((gigId) => {
    const newGs = resolveGigBoost(gs, gigId);
    setGs(newGs);
    if (isMultiplayer) mpSave(newGs);
  }, [gs, isMultiplayer, mpSave]);

  const handleNewGame = useCallback(() => {
    setSelectedCard(null);
    setSelectedAttacker(null);
    setGearTarget(null);
    const fresh = createInitialState();
    setGs(setupGame(fresh));
  }, []);

  const handleLeaveRoom = () => navigate('/');

  const canSell = selectedCard !== null && gs.player?.hand[selectedCard]?.sellable && !gs.soldThisTurn;
  const canPlay = selectedCard !== null && gs.player?.hand[selectedCard] &&
    (getAvailableEddies(gs.player) + getAvailableLegendEddies(gs.player)) >= (gs.player.hand[selectedCard]?.cost || 0);

  const isGameOver = gs.phase === PHASES.GAME_OVER;
  const disableActions = isMultiplayer && waitingForOpponent;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-card/50">
        <div className="flex items-center gap-2">
          <h1 className="font-orbitron text-sm md:text-lg font-bold text-primary tracking-wider">
            CYBERPUNK <span className="text-secondary">TCG</span>
          </h1>
          {isMultiplayer && myRoleRef.current && (
            <span className="text-xs font-mono text-muted-foreground border border-border/40 rounded px-1.5 py-0.5">
              {myRoleRef.current === 'player1' ? 'Player 1' : 'Player 2'}
            </span>
          )}
        </div>
        <PhaseIndicator phase={gs.phase} turn={gs.turn} overtime={gs.overtime} />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowRules(!showRules)} className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLeaveRoom} className="text-muted-foreground hover:text-red-400 gap-1 font-rajdhani text-xs">
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
              {gs.player.hand.map((card) => (
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
      <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <PlayerArea
            player={gs.opponent}
            isOpponent
            phase={gs.phase}
            onFieldUnitClick={!disableActions ? handleOpponentFieldClick : () => {}}
            playerLabel={isMultiplayer ? oppPlayerLabel : 'RIVAL'}
          />

          <div className="flex items-center gap-2 px-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
            <Swords className="w-4 h-4 text-secondary/60" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
          </div>

          <PlayerArea
            player={gs.player}
            phase={gs.phase}
            onLegendClick={!disableActions ? handleCallLegend : () => {}}
            onFieldUnitClick={!disableActions ? handleFieldUnitClick : () => {}}
            onFixerDieClick={!disableActions ? handlePickGig : () => {}}
            selectedAttacker={selectedAttacker}
            playerLabel={isMultiplayer ? myPlayerLabel : 'YOU'}
          />

          <HandArea
            hand={gs.player.hand}
            onCardClick={!disableActions ? handleCardClick : () => {}}
            selectedCard={selectedCard}
            phase={gs.phase}
            availableEddies={getAvailableEddies(gs.player) + getAvailableLegendEddies(gs.player)}
          />

          <ActionBar
            phase={gs.phase}
            selectedCard={selectedCard}
            selectedAttacker={selectedAttacker}
            onSellCard={!disableActions ? handleSellCard : () => {}}
            onPlayCard={!disableActions ? handlePlayCard : () => {}}
            onStartAttack={!disableActions ? handleStartAttack : () => {}}
            onEndTurn={!disableActions ? handleEndTurn : () => {}}
            onAttackRival={!disableActions ? handleAttackRival : () => {}}
            onNewGame={handleNewGame}
            canSell={canSell && !disableActions}
            canPlay={canPlay && !disableActions}
            message={disableActions ? "Waiting for opponent's move..." : gs.message}
            isMultiplayer={isMultiplayer}
          />
        </div>

        <div className={cn("lg:w-72 flex-shrink-0", isGameOver ? "h-72 lg:h-auto" : "h-40 lg:h-auto")}>
          <GameLog logs={gs.gameLog} alwaysExpanded={isGameOver} />
        </div>
      </div>

      <CardDetailModal card={detailCard} open={!!detailCard} onClose={() => setDetailCard(null)} />

      {gs.phase === PHASES.BLOCKER_DECISION && gs.pendingAttackers?.length > 0 && (
        <BlockerDecisionModal
          pendingAttack={{ attacker: gs.pendingAttackers[0] }}
          playerField={gs.player.field}
          onBlock={(blockerUid) => handleBlockerDecision(blockerUid)}
          onAllow={() => handleBlockerDecision(null)}
        />
      )}

      {gs.showAdjustGigModal && (
        <AdjustGigModal
          rivalGigs={gs.opponent.gigDice}
          playerGigs={gs.player.gigDice}
          onAdjust={handleAdjustGig}
          onClose={() => setShowAdjustGigModal(false)}
        />
      )}

      {gs.pendingGigSteal && (
        <GigStealModal
          availableGigs={gs.opponent.gigDice}
          count={gs.pendingGigSteal.gigsToSteal - gs.pendingGigSteal.stolen}
          attackerName={gs.player.field.find(u => u.uid === gs.pendingGigSteal.attackerUid)?.name || 'Your unit'}
          onSteal={handleGigSteal}
        />
      )}

    {gs.awaitingTarget && (
  <ChooseGigModal
    gigs={gs.player.gigDice}
    amount={gs.pendingEffect?.amount || 1}
    title="SELECT TARGET"
    description="Choose a Gig to apply the effect."
    onChoose={(gigId) => {
      const newGs = resolvePendingEffect(gs, gigId);
      setGs(newGs);
    }}
  />
)}

    </div>
  );
}