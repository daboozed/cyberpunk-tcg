// IMPORTANT:
// Before refactoring/splitting this file, read:
// docs/game-jsx-split-reference.md
//
// This file currently owns gameplay wiring, multiplayer sync,
// UI state, action handlers, overlays, and board rendering.
// Split gradually using the documented plan.

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameViewState } from "@/hooks/useGameViewState";
import { useCardData } from "@/hooks/useCardData";
import { useSinglePlayerSetup } from "@/hooks/useSinglePlayerSetup";
import { useMultiplayerRoomSync } from "@/hooks/useMultiplayerRoomSync";
import { resolveEffect } from "@/lib/effectResolver";
import GameModals from "@/components/game/GameModals";
import GameTopBar from "@/components/game/GameTopBar";
import GameOverOverlay from "@/components/game/GameOverOverlay";
import WaitingForOpponentOverlay from "@/components/game/WaitingForOpponentOverlay";
import MulliganOverlay from "@/components/game/MulliganOverlay";
import RulesOverlay from "@/components/game/RulesOverlay";
import GameActionBar from "@/components/game/GameActionBar";
import { useReadyPhaseAutoAdvance } from "@/hooks/useReadyPhaseAutoAdvance";
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
} from "@/lib/engine/EconomyEngine";
import { buildCustomDeck } from "@/lib/cardPool";
import PlayerArea from "@/components/game/PlayerArea";
import HandArea from "@/components/game/HandArea";
import GameLog from "@/components/game/GameLog";

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
  const { cardMap } = useCardData();
  const [gs, setGs] = useState(() => createInitialState());

  const [actualIndex, setactualIndex] = useState(null);
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [hoveredViktorCard, setHoveredViktorCard] = useState(null);
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [gearTarget, setGearTarget] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [rolledThisTurn, setRolledThisTurn] = useState(false);
  const [mulliganPreview, setMulliganPreview] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pendingProgram, setPendingProgram] = useState(null);
  const [showFloorItModal, setShowFloorItModal] = useState(false);
  const [floorItCardIndex, setFloorItCardIndex] = useState(null);
  const [peekedLegend, setPeekedLegend] = useState(null);
  const [peekIndex, setPeekIndex] = useState(null);

  const isGameOver = gs.phase === PHASES.GAME_OVER;
  const {
    waitingForOpponent,
    setWaitingForOpponent,
    myPlayerLabel,
    myRoleRef,
    mpSave,
  } = useMultiplayerRoomSync({
    isMultiplayer,
    roomId,
    navigate,
    setGs,
  });
  const disableActions = isMultiplayer && waitingForOpponent;

  useSinglePlayerSetup({
  isMultiplayer,
  gs,
  cardMap,
  setGs,
});

useReadyPhaseAutoAdvance({
  gs,
  setGs,
  isMultiplayer,
  waitingForOpponent,
  setRolledThisTurn,
});

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
    return;
  }

  const side = player === "opponent" ? gs.opponent : gs.player;
const die = side?.fixerArea?.[index];

  if (!die) return;

  const finalRoll =
    result ?? Math.floor(Math.random() * die.sides) + 1;

  const newGs = pickGigDie(
    gs,
    index,
    finalRoll,
    player === "opponent" ? "opponent" : "player"
  );

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
  if (!card || card.sellable !== true) return;

  const newGs = sellCard(gs, index);
  setGs(newGs);

  if (isMultiplayer) mpSave(newGs);

}, [gs, isMultiplayer, mpSave]);

  const handlePlayCard = useCallback((index) => {
  if (index === null || index === undefined) return;

  const card = gs.player.hand[index];
    
  if (!card) return;

  if (card.type === 'gear') {
    if (gs.player.field.length === 0) {
      setGs(prev => ({ ...prev, message: 'No units on the field to equip Gear to!' }));
      return;
    }
    setGearTarget(index);
    setGs(prev => ({ ...prev, message: 'Select a friendly unit to equip this Gear to.' }));
    return;
  }

  if (card.type === "program" && card.id === "p1") {
  if (pendingProgram?.targetType === "friendlyUnit") {
    setPendingProgram(null);
    return;
  }

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

    setPendingProgram({
      card,
      cardIndex: index,
      targetType: "spentUnitMax4"
    });
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

  const resolveFloorItTarget = useCallback((ownerKey, unit) => {
    if (pendingProgram?.targetType !== "spentUnitMax4") return false;
    if (!unit?.spent || (unit.cost || 0) > 4) return false;

    const newGs = structuredClone(gs);
    const owner = newGs[ownerKey];
    const unitIndex = owner.field.findIndex(u => u.uid === unit.uid);
    if (unitIndex === -1) return true;

    const [returnedUnit] = owner.field.splice(unitIndex, 1);
    returnedUnit.spent = false;
    owner.hand.push(returnedUnit);

    const program = newGs.player.hand[pendingProgram.cardIndex];
    if (program) {
      newGs.player.hand.splice(pendingProgram.cardIndex, 1);
      newGs.player.trash.push(program);
    }

    newGs.message = `Floor It returned ${returnedUnit.name} to hand.`;

    setGs(newGs);
    setPendingProgram(null);
    setactualIndex(null);
    setSelectedAttacker(null);

    if (isMultiplayer) mpSave(newGs);
    return true;
  }, [gs, pendingProgram, isMultiplayer, mpSave]);

  const handleFieldUnitClick = useCallback((unit) => {
  if (resolveFloorItTarget("player", unit)) return;

  if (gearTarget !== null && gs.phase === PHASES.PLAY) {
    const newGs = playCard(gs, gearTarget, unit.uid);
    setGs(newGs);
    setGearTarget(null);
    setactualIndex(null);
    setSelectedAttacker(null);

    if (isMultiplayer) mpSave(newGs);
    return;
  }

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

if (gs.phase === PHASES.ATTACK) {
  if (!unit || unit.spent || unit.justPlayed || unit.cantAttack) return;

  setSelectedAttacker(prev =>
    prev === unit.uid ? null : unit.uid
  );

  setactualIndex(null);
  return;
}

setSelectedAttacker(null);
setactualIndex(null);
  }, [gs, gearTarget, pendingProgram, isMultiplayer, mpSave, resolveFloorItTarget]);

  const handleOpponentFieldClick = useCallback((unit) => {

  if (resolveFloorItTarget("opponent", unit)) return;

  if (pendingProgram) {
    const card = pendingProgram.card;

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
  mpSave,
  resolveFloorItTarget
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
    
    if (!isMultiplayer && gs.currentPlayer === "player") {    setGs(prev => ({     ...prev,     message: "Opponent is thinking..."   }));    setTimeout(() => {     const passTurn = {       ...gs,       currentPlayer: "opponent"     };      setGs(passTurn);      setTimeout(() => {       const aiState = readyPhase(passTurn);        setGs({         ...aiState,         message: "Opponent finished their turn."       });      }, 900);    }, 500);    return; }
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
      mpSave(newGs, true);
      setWaitingForOpponent(true);
    }
  }, [gs, isMultiplayer, mpSave, setWaitingForOpponent]);

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

const {
  phaseButtonLabel,
  phaseButtonDisabled,
  phaseButtonStyle,
  getDerivedMessage,
} = useGameViewState({
  gs,
  disableActions,
  isGameOver,
  gearTarget,
  selectedAttacker,
  actualIndex,
  canPlay,
  canSell,
  attackBtn,
});

return (
<div className="min-h-screen w-screen flex flex-col relative overflow-y-auto scanlines" style={{ background: '#020d18' }}>
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: 'linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '40px 40px'
  }} />
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,255,255,0.06) 0%, transparent 70%)' }} />
      <GameTopBar
        showRules={showRules}
        setShowRules={setShowRules}
        setShowCombatLog={setShowCombatLog}
        handleLeaveRoom={handleLeaveRoom}
      />

      <GameOverOverlay
        isGameOver={isGameOver}
        gs={gs}
        handleNewGame={handleNewGame}
        navigate={navigate}
        isMultiplayer={isMultiplayer}
      />

      <WaitingForOpponentOverlay
        isMultiplayer={isMultiplayer}
        waitingForOpponent={waitingForOpponent}
        isGameOver={isGameOver}
        myRoleRef={myRoleRef}
      />

      <MulliganOverlay
        gs={gs}
        isMultiplayer={isMultiplayer}
        handleMulligan={handleMulligan}
        mulliganPreview={mulliganPreview}
        setMulliganPreview={setMulliganPreview}
        mousePos={mousePos}
        setMousePos={setMousePos}
      />

      <RulesOverlay
        showRules={showRules}
        setShowRules={setShowRules}
      />

        <div className="flex flex-col items-center relative z-10 w-full flex-1">

  <div className="w-full max-w-[1200px]">
   
   <PlayerArea
      player={gs.opponent}
      pendingProgram={pendingProgram}
      rolledThisTurn={rolledThisTurn}
      isOpponent
      phase={gs.phase}
      selectedAttacker={selectedAttacker}
      onFieldUnitClick={handleOpponentFieldClick}
      onAttackGig={handleAttackGig}
      onRollGig={handlePickGig}
      
    />

  </div>

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

  <div className="w-full max-w-[1200px] mt-2">

  <GameActionBar
    actionBtn={actionBtn}
    phaseButtonStyle={phaseButtonStyle}
    phaseButtonLabel={phaseButtonLabel}
    phaseButtonDisabled={phaseButtonDisabled}
    handleStartAttack={handleStartAttack}
    pendingBlock={gs.pendingBlock}
    passBtn={passBtn}
    handleBlockerDecision={handleBlockerDecision}
    endTurnBtn={endTurnBtn}
    handleEndTurn={handleEndTurn}
  />
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
