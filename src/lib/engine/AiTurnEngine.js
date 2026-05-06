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

// Placeholder for the extracted AI turn implementation.
// Keeping this non-live until gameEngine.js is safely wired to import it.
export function aiTurn(state, dependencies = {}) {
  const s = clone(state);
  const deps = createAiTurnDependencies(dependencies);

  log(s, "AI turn engine placeholder reached");

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
  resolveEffect,
  uid,
};
