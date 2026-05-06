import { clone, uid } from "./utils";
import { resolveEffect } from "../effectResolver";

// =========================
// AI TURN ENGINE
// =========================
//
// This module is the dedicated home for opponent AI turn logic.
// The current live AI implementation still lives in gameEngine.js until
// the extraction is completed and wired safely.

function log(s, msg) {
  s.gameLog.push({ msg, time: Date.now() });
}

function getPower(unit) {
  return (
    (unit.power || 0) +
    (unit.powerBonus || 0) +
    ((unit.gear || []).reduce((sum, gear) => sum + (gear.powerBonus || 0), 0))
  );
}

function getAvailableAiEddies(player) {
  return (
    (player.eddies || []).filter(e => !e.spent).length +
    (player.legends || []).filter(l => !l.spent && !l.goSoloActive).length
  );
}

function spendAiEddies(player, amount) {
  let remaining = amount;

  (player.eddies || []).forEach(e => {
    if (!e.spent && remaining > 0) {
      e.spent = true;
      remaining--;
    }
  });

  (player.legends || []).forEach(l => {
    if (!l.spent && !l.goSoloActive && remaining > 0) {
      l.spent = true;
      remaining--;
    }
  });
}

function removeFromHand(player, card) {
  const index = player.hand.indexOf(card);
  if (index >= 0) player.hand.splice(index, 1);
}

function playToTrash(player, card) {
  removeFromHand(player, card);
  player.trash.push(card);
}

function rollHighestAvailableFixerDie(s, player) {
  if (!Array.isArray(player.fixerArea) || player.fixerArea.length === 0) return;

  const die = player.fixerArea.slice().sort((a, b) => b.sides - a.sides)[0];
  const index = player.fixerArea.findIndex(d => d.id === die.id);
  const value = Math.ceil(Math.random() * die.sides);

  player.gigDice.push({
    id: uid(),
    sides: die.sides,
    label: die.label,
    value,
  });

  player.fixerArea.splice(index, 1);
  log(s, `Player 2 rolls ${die.label} → ${value}`);
}

function sellIfDeadHand(s, player) {
  const playable = player.hand.filter(card => (card.cost || 0) <= getAvailableAiEddies(player));
  if (playable.length > 0) return;

  const sell = player.hand
    .filter(card => card.sellable)
    .sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];

  if (!sell) return;

  removeFromHand(player, sell);
  player.eddies.push({ id: uid(), spent: false });
  log(s, `Player 2 sells ${sell.name}`);
}

function beginAiTurn(s) {
  const player = s.opponent;

  log(s, "===== BRUTAL AI TURN =====");
  rollHighestAvailableFixerDie(s, player);
  log(s, "Player 2 — PLAY PHASE");
  sellIfDeadHand(s, player);

  return s;
}

// These are the outside functions the extracted AI will need while gameEngine.js
// still owns combat, gear triggers, and phase transitions.
//
// Expected dependency shape for the final extraction:
// {
//   readyPhase: (state) => state,
//   triggerGearEffects: (state, unit, triggerName) => void,
//   resolveEffect: (effectData, context) => void,
//   uid: () => string,
// }
export function createAiTurnDependencies(overrides = {}) {
  return {
    readyPhase: null,
    triggerGearEffects: null,
    resolveEffect,
    uid,
    ...overrides,
  };
}

// Partial extracted AI turn implementation.
// Keeping this non-live until gameEngine.js is safely wired to import it.
export function aiTurn(state, dependencies = {}) {
  const s = clone(state);
  const deps = createAiTurnDependencies(dependencies);

  beginAiTurn(s);
  log(s, "AI turn engine extraction placeholder reached");

  if (typeof deps.readyPhase === "function") {
    return deps.readyPhase(s);
  }

  return s;
}

export const aiHelpers = {
  getPower,
  getAvailableAiEddies,
  spendAiEddies,
  removeFromHand,
  playToTrash,
  rollHighestAvailableFixerDie,
  sellIfDeadHand,
  beginAiTurn,
  resolveEffect,
  uid,
};
