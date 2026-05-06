import { clone, uid, shuffle } from "./utils";
import {
  getAvailableEddies,
  getAvailableLegendEddies,
  spendEddies,
  getUnitPower,
  calcPower
} from "./EconomyEngine";
   
export { resolveGigBoost } from "../effectResolver";
import { resolveLegendFlip } from "../legendFlipResolver";
import { resolveEffect } from "../effectResolver";
import { aiTurn as runAiTurn } from "./AiTurnEngine";
  // =========================
  // PHASES
  // =========================
  export const PHASES = {
    SETUP:"setup",
    MULLIGAN:"mulligan",
    READY:"ready",
    PICK_GIG:"pick_gig",
    PLAY:"play",
    ATTACK:"attack",
    GAME_OVER:"game_over"
  };

  // =========================
  // INITIAL STATE
  // =========================
  export function createInitialState(playerDeck=[],opponentDeck=[]){
  return {
    turn:1,
    currentPlayer:"player",
    firstPlayer:null,
    phase:PHASES.SETUP,
    gameLog:[],
    pendingEffect: null,
    awaitingTarget: false,
    calledLegendThisTurn:false,
    soldThisTurn:false,
    player:createPlayer(playerDeck,"p1"),
    opponent:createPlayer(opponentDeck,"p2")
  };
  }

  function createPlayer(deck,prefix){
    const legends = (deck?.legends || []).map(l=>({
      ...l,
      faceUp:false,
      spent:false
    }));

    const mainDeck = deck?.mainDeck || deck || [];

    return {
      deck:shuffle(mainDeck),
      hand:[],
      field:[],
      eddies:[],
      legends,
      trash:[],
      gigDice:[],
      streetCred:0,
      fixerArea:[
        {id:`${prefix}-d4`,sides:4,label:"d4"},
        {id:`${prefix}-d6`,sides:6,label:"d6"},
        {id:`${prefix}-d8`,sides:8,label:"d8"},
        {id:`${prefix}-d10`,sides:10,label:"d10"},
        {id:`${prefix}-d12`,sides:12,label:"d12"},
        {id:`${prefix}-d20`,sides:20,label:"d20"}
      ]
    };
  }

  function log(s,msg){
    s.gameLog.push({msg,time:Date.now()});
  }

  function updateStreetCred(s) {
  s.player.streetCred = (s.player.gigDice || []).reduce(
    (total, gig) => total + (gig.value || 0),
    0
  );

  s.opponent.streetCred = (s.opponent.gigDice || []).reduce(
    (total, gig) => total + (gig.value || 0),
    0
  );
}

  // =========================
  // SETUP
  // =========================
  export function setupGame(state){
    const s=clone(state);

    const playerFirst=Math.random()>0.5;
    s.firstPlayer=playerFirst?"player":"opponent";
    s.currentPlayer=s.firstPlayer;

    log(s, playerFirst ? "Player 1 goes first" : "Player 2 goes first");
    log(s, playerFirst ? "Player 2 goes second" : "Player 1 goes second");

    for(let i=0;i<6;i++){
      if(s.player.deck.length) s.player.hand.push(s.player.deck.pop());
      if(s.opponent.deck.length) s.opponent.hand.push(s.opponent.deck.pop());
    }

    s.phase=PHASES.MULLIGAN;
    return s;
  }

  // =========================
  // MULLIGAN
  // =========================
  export function mulligan(state,doMulligan){
    const s=clone(state);

    if(doMulligan){
      s.player.deck=shuffle([...s.player.deck,...s.player.hand]);
      s.player.hand=[];
      for(let i=0;i<6;i++){
        if(s.player.deck.length) s.player.hand.push(s.player.deck.pop());
      } 
      log(s,"Player 1 mulligans");
    }else{
      log(s,"Player 1 keeps their hand");
    }

    // AI decides whether to mulligan
    const aiCheapUnits = s.opponent.hand.filter(c => c.type === 'unit' && (c.cost||0) <= 3);
    if(aiCheapUnits.length < 2){
      s.opponent.deck = shuffle([...s.opponent.deck,...s.opponent.hand]);
      s.opponent.hand = [];
      for(let i=0;i<6;i++){
        if(s.opponent.deck.length) s.opponent.hand.push(s.opponent.deck.pop());
      }
      log(s,"Player 2 mulligans");
    }else{
      log(s,"Player 2 keeps their hand");
    }

    log(s,"*************** START! ***************");

    s.phase=PHASES.READY;
    return readyPhase(s);
  }

  // =========================
  // READY
  // =========================
  export function readyPhase(state){
    const s=clone(state);
    const isPlayer=s.currentPlayer==="player";
    const p=isPlayer?s.player:s.opponent;
    const num=isPlayer?1:2;
     
    if ((p.gigDice?.length || 0) >= 6) {
  s.phase = PHASES.GAME_OVER;
  s.winner = isPlayer ? "player" : "opponent";
  s.message = isPlayer
    ? "You start your turn with 6 Gigs — You win!"
    : "Player 2 starts turn with 6 Gigs — Player 2 wins!";
    
  log(s, isPlayer
    ? "*** Player 1 WINS! ***"
    : "*** Player 2 WINS! ***");

  return s;
}

    s.calledLegendThisTurn=false;
    s.soldThisTurn=false;

    log(s,`===== Turn ${s.turn} =====`);
    log(s,`Player ${num} — READY PHASE`);

    if(p.deck.length){
      p.hand.push(p.deck.pop());
      log(s,`     Player ${num} draws card`);
    }

    p.eddies.forEach(e=>e.spent=false);
    p.legends.forEach(l=>l.spent=false);
    p.field.forEach(u=>{u.spent=false;u.justPlayed=false;});

    console.log("RESET AI/PLAYER RESOURCES", {
      player: s.currentPlayer,
      eddies: p.eddies,
      legends: p.legends
});
    
    log(s,"     Ready spent cards");

    if(!isPlayer){
      return runAiTurn(s, {
        readyPhase,
        triggerGearEffects
      });
    }

    s.phase=PHASES.PICK_GIG;
    return s;
  }

  // =========================
  // PICK GIG
  // =========================
  export function pickGigDie(state, index, value, side = "player") {
  const s = clone(state);

  const p = side === "player" ? s.player : s.opponent;

  // 🔥 HARD GUARD: ensure fixerArea exists
  if (!Array.isArray(p.fixerArea)) return s;

  const die = p.fixerArea[index];

  // 🔥 HARD GUARD: invalid index or die
  if (!die || typeof die.sides !== "number") {
    console.warn("INVALID DIE PICK:", { index, die });
    return s;
  }

  const finalValue = value ?? Math.ceil(Math.random() * die.sides);

  // 🔥 REMOVE SAFELY
  p.fixerArea = p.fixerArea.filter((_, i) => i !== index);

  // 🔥 CREATE GUARANTEED VALID DIE
  const newDie = {
    id: `gig_${Date.now()}_${Math.random().toString(36).slice(2)}`, // 🔥 stronger than uid()
    sides: die.sides,
    label: die.label || `D${die.sides}`,
    value: finalValue,
  };

  // 🔥 FINAL VALIDATION (THIS PREVENTS YOUR CRASH)
  if (!newDie.id || !newDie.sides) {
    console.error("BAD DIE CREATED:", newDie);
    return s;
  }

  // 🔥 ENSURE ARRAY EXISTS
  if (!Array.isArray(p.gigDice)) {
    p.gigDice = [];
  }

  p.gigDice.push(newDie);
  updateStreetCred(s);

  log(s, `     Rolled ${newDie.label} → ${finalValue}`);

  if (side === "player") {
    log(s, "Player 1 — PLAY PHASE");
    s.phase = PHASES.PLAY;
  }

  return s;
}

  // =========================
  // SELL CARD (1 at a time)
  // =========================
  export function sellCard(state, cardIndex){
  const s = clone(state);
  if(s.phase !== PHASES.PLAY) return s;
  if(s.soldThisTurn) return s;

  const p = s.player;
  const card = p.hand[cardIndex];
  if(!card) return s;

  p.hand.splice(cardIndex,1);
  p.eddies.push({id:uid(),spent:false});

  s.soldThisTurn=true;

  log(s,`     Sold ${card.name}`);
  return s;
}

// =========================
// PLAY CARD
// =========================
export function playCard(state, cardIndex, targetUid){
  const s = clone(state);
  if(s.phase !== PHASES.PLAY) return s;

  const p = s.player;
  const card = p.hand[cardIndex];
  if(!card) return s;

const effect = card.effectKey || card.id;
console.log("PLAYCARD effect:", effect);

const requiresTarget =
  effect === "p1" ||
  effect === "p2" ||
  effect === "p3" ||
  effect === "p4" ||
  effect === "p5" ||
  effect === "p7";

if (requiresTarget) {
  console.log("TARGET REQUIRED → opening modal");

  s.pendingEffect = {
    effect,
    cardIndex,
    player: "player"
  };

  s.awaitingTarget = true;
  return s;
}

const cost = card.cost ?? 0;


  if(getAvailableEddies(p)+getAvailableLegendEddies(p) < cost) return s;

  spendEddies(p,cost);
  p.hand.splice(cardIndex,1);

  // ================= PROGRAM =================
if (card.type === "program") {
  log(s, `     Played ${card.name}`);

  const cost = card.cost ?? 0;

  if (getAvailableEddies(p) + getAvailableLegendEddies(p) < cost) {
    return s;
  }

  spendEddies(p, cost);
  p.hand.splice(cardIndex, 1);

  if (card.effectData) {
    resolveEffect(card.effectData, {
      state: s,
      player: "player",
      targetUid
    });
  }

  p.trash.push(card);
  log(s, "     sent to trash");

  return s;
}

  // Gear attach
  if(card.type === 'gear' && targetUid) {
    const target = p.field.find(u => u.uid === targetUid);
    if(target) {
      if(!target.gear) target.gear = [];
      target.gear.push({...card, uid: uid()});
      log(s,`     Equipped ${card.name} to ${target.name}`);
      return s;
    }
  }

  p.field.push({
    ...card,
    uid:uid(),
    spent:false,
    justPlayed:true
  });

console.log("AI FIELD:", p.field);

  log(s,`     Played ${card.name}`);
  return s;
}

// =========================
// RESOLVE PENDING EFFECT
// =========================
export function resolvePendingEffect(state, targetUid){
  const s = clone(state);

  if(!s.pendingEffect) return s;

  const { cardIndex, player } = s.pendingEffect;
  const p = s[player];
  const card = p.hand[cardIndex];
  if(!card) return s;

  const cost = card.cost ?? 0;
  if(getAvailableEddies(p)+getAvailableLegendEddies(p) < cost) return s;

  spendEddies(p,cost);
  const [removedCard] = p.hand.splice(cardIndex,1);

  // Resolve program effect using effectData
if (card.type === 'program' && card.effectData) {
  resolveEffect(card.effectData, {
    state: s,
    player,
    targetUid
  });
}

  p.trash.push(removedCard);
  s.pendingEffect = null;
  s.awaitingTarget = false;

  return s;
}

  // =========================
  // CALL LEGEND
  // =========================
  export function callLegend(state, legendIndex){
  const s = clone(state);
  if (s.phase !== PHASES.PLAY) return s;
  if (s.calledLegendThisTurn) return s;

  const p = s.player;
  const lg = p.legends?.[legendIndex];

  if (!lg || lg.faceUp) return s;

  if (getAvailableEddies(p) + getAvailableLegendEddies(p) < 2) return s;

  spendEddies(p, 2);

  lg.faceUp = true;
  s.calledLegendThisTurn = true;

  const newState = resolveLegendFlip(s, lg);

  newState.soldThisTurn = false;

  log(newState, `     Called Legend ${lg.name || ""}`);

  return newState;
}

  // =========================
  // ATTACK PHASE
  // =========================
  export function startAttackPhase(state){
    const s = clone(state);
    if(s.phase !== PHASES.PLAY) return s;

    log(s,"Player 1 — ATTACK PHASE");
    s.phase = PHASES.ATTACK;
    return s;
  }

  // =========================
  // END TURN
  // =========================
  export function endTurn(state){
  const s = clone(state);

  s.currentPlayer =
    s.currentPlayer === "player"
      ? "opponent"
      : "player";

  // New full turn begins when it returns to Player 1
  if (s.currentPlayer === "player") {
    s.turn++;
  }

  return readyPhase(s);
}

  // =========================
  // REQUIRED EXPORTS
  // =========================
export function resolveAfterpartyAdjustment(state, gigIndex, adjustment) {
  const s = clone(state);

  const gig = s.opponent.gigDice[gigIndex];
  if (!gig) return s;

  gig.value = Math.max(
    1,
    Math.min(gig.sides, gig.value + adjustment)
  );

  log(s, `     Rival Gig adjusted to ${gig.value}`);

  return s;
}

  export function resolveGigSteal(state, attackerUid, gigId){
  const s = clone(state);

  if(s.phase !== PHASES.ATTACK) return s;

  const attacker = s.player.field.find(u => u.uid === attackerUid);
  if(!attacker || attacker.spent || attacker.justPlayed || attacker.cantAttack) return s;

  const idx = s.opponent.gigDice.findIndex(d => d.id === gigId);
  if(idx === -1) return s;

  // 🔥 STEAL
  const [stolen] = s.opponent.gigDice.splice(idx, 1);
  s.player.gigDice.push({ ...stolen, id: uid() });

  attacker.spent = true;

// Resolve gear effects when this unit attacks

log(s, `     ${attacker.name} steals Gig (${stolen.label} — value: ${stolen.value})`);

  // 🏆 WIN CHECK

  return s;
}

  export function attackRival(state, attackerUid){
    const s = clone(state);
    if(s.phase !== PHASES.ATTACK) return s;

    const attacker = s.player.field.find(u => u.uid === attackerUid);
    if(!attacker || attacker.spent || attacker.justPlayed || attacker.cantAttack) return s;

    attacker.spent = true;

// Resolve all equipped gear effects that trigger when this unit attacks
    triggerGearEffects(s, attacker, "onAttack");

    if(s.opponent.gigDice.length === 0){
      log(s, `     ${attacker.name} attacks rival directly but rival has no Gigs!`);
      return s;
    }

    const atkPow = (attacker.power || 0) + (attacker.powerBonus || 0) +
      ((attacker.gear || []).reduce((sum, g) => sum + (g.powerBonus || 0), 0));
    const gigsToSteal = 1 + Math.floor(atkPow / 10);

    // Auto-steal if opponent only has 1 gig
    if(s.opponent.gigDice.length === 1){
      const [stolen] = s.opponent.gigDice.splice(0, 1);
      s.player.gigDice.push({ ...stolen, id: uid() });
      log(s, `     ${attacker.name} attacks rival directly! Steals Gig (${stolen.label} — value: ${stolen.value})`);
      
      return s;
    }

    log(s, `     ${attacker.name} attacks rival directly! Choose a Gig to steal.`);
    s.pendingGigSteal = { attackerUid, gigsToSteal, stolen: 0 };

    return s;
  }

  export function attackUnit(state, attackerUid, defenderUid){
    const s = clone(state);
    if(s.phase !== PHASES.ATTACK) return s;

    const attacker = s.player.field.find(u => u.uid === attackerUid);
    const defender = s.opponent.field.find(u => u.uid === defenderUid);
    if(!attacker || attacker.spent || attacker.justPlayed || !defender) return s;

    attacker.spent = true;

// Trigger attack gear effects FIRST
triggerGearEffects(s, attacker, "onAttack");

const atkPow = (attacker.power || 0) + (attacker.powerBonus || 0) +
  ((attacker.gear || []).reduce((sum, g) => sum + (g.powerBonus || 0), 0));

const defPow = (defender.power || 0) + (defender.powerBonus || 0) +
  ((defender.gear || []).reduce((sum, g) => sum + (g.powerBonus || 0), 0));

    if(atkPow >= defPow){
      const idx = s.opponent.field.findIndex(u => u.uid === defenderUid);
      if(idx >= 0){ const [d] = s.opponent.field.splice(idx, 1); s.opponent.trash.push(d); }
      log(s, `     ${attacker.name} defeats ${defender.name}`);
    } else {
      const idx = s.player.field.findIndex(u => u.uid === attackerUid);
      if(idx >= 0){ const [d] = s.player.field.splice(idx, 1); s.player.trash.push(d); }
      log(s, `     ${attacker.name} is defeated by ${defender.name}`);
    }

    return s;
  }

export function resolveBlockerDecision(state, blockerUid = null) {
  const s = clone(state);

  if (!s.pendingBlock) return s;

  const {
    attacker,
    targetType,
    targetUid
  } = s.pendingBlock;

  const blocker = blockerUid
    ? s.player.field.find(u => u.uid === blockerUid)
    : null;

  // NO BLOCK CHOSEN
  if (!blocker) {
    if (targetType === "gig") {
      if (s.player.gigDice.length > 0) {
        const best = s.player.gigDice.reduce((best, g, i) =>
          g.value > s.player.gigDice[best].value ? i : best, 0
        );

        const [stolen] = s.player.gigDice.splice(best, 1);
        s.opponent.gigDice.push({ ...stolen, id: uid() });

        log(s, `${attacker.name} steals Gig ${stolen.value}`);
      }
    }

    if (targetType === "unit") {
      const idx = s.player.field.findIndex(u => u.uid === targetUid);
      if (idx >= 0) {
        const [dead] = s.player.field.splice(idx, 1);
        s.player.trash.push(dead);

        log(s, `${attacker.name} defeats ${dead.name}`);
      }
    }

    s.pendingBlock = null;
    return s;
  }

  // BLOCK COMBAT
  blocker.spent = true;

  const atkPow = calcPower(attacker);
  const defPow = calcPower(blocker);

  if (atkPow >= defPow) {
    const idx = s.player.field.findIndex(u => u.uid === blocker.uid);
    if (idx >= 0) {
      const [dead] = s.player.field.splice(idx, 1);
      s.player.trash.push(dead);
    }

    log(s, `${blocker.name} blocks but is defeated by ${attacker.name}`);
  } else {
    const idx = s.opponent.field.findIndex(u => u.uid === attacker.uid);
    if (idx >= 0) {
      const [dead] = s.opponent.field.splice(idx, 1);
      s.opponent.trash.push(dead);
    }

    log(s, `${blocker.name} blocks and defeats ${attacker.name}`);
  }

  s.pendingBlock = null;
  return s;
}

  export function playLegendAsSolo(state, legendIndex){
    const s = clone(state);
    if(s.phase !== PHASES.PLAY) return s;
    
    const p = s.player;
    const legend = p.legends?.[legendIndex];
    if(!legend || !legend.faceUp) return s;
    
    if(getAvailableEddies(p)+getAvailableLegendEddies(p) < (legend.cost || 0)) return s;
    
    spendEddies(p, legend.cost || 0);
    
    p.field.push({
      ...legend,
      uid:uid(),
      spent:false,
      isLegend:true
    });
    
    legend.goSoloActive = true;
    s.soldThisTurn = false;
    
    log(s, `     Called Legend ${legend.name} (GO SOLO)`);
    return s;
  }

  // =========================
  // HELPERS
  // =========================
function triggerGearEffects(state, unit, trigger) {
  const gears = unit.gear || [];

  for (const gear of gears) {

    // KIROSHI OPTICS
    if (
      gear.name?.toLowerCase().includes("kiroshi") &&
      trigger === "onAttack"
    ) {
      const owner = state.player.field.some(u => u.uid === unit.uid)
  ? "player"
  : "opponent";

state.pendingLegendPeek = { owner };

log(
  state,
  "     Kiroshi Optics activates — peek at a friendly face-down Legend"
       );
    }
  }
}