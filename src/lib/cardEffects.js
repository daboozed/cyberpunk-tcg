// cardEffects.js — Card effect resolution logic

import { getAvailableEddies, getAvailableLegendEddies, spendEddies, getUnitPower } from "./engine/helpers";

function log(s, msg) {
  s.gameLog.push({ msg, time: Date.now() });
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// =========================
// PROGRAM EFFECTS
// =========================

/**
 * p1 — Reboot Optics: Give a friendly Unit +4 Power this turn. Defeat it at end of turn.
 */
export function resolveRebootOptics(state, targetUid) {
  const s = state;
  const unit = s.player.field.find(u => u.uid === targetUid);
  if (!unit) return s;
  unit.powerBonus = (unit.powerBonus || 0) + 4;
  unit.defeatedAtEndOfTurn = true;
  log(s, `     Reboot Optics: ${unit.name} gains +4 Power (defeated at end of turn)`);
  return s;
}

/**
 * p2 — Floor It: Return a spent Unit with cost 4 or less to its owner's hand.
 */
export function resolveFloorIt(state, targetUid) {
  const s = state;
  const idx = s.opponent.field.findIndex(u => u.uid === targetUid && u.spent && (u.cost || 0) <= 4);
  if (idx === -1) return s;
  const [unit] = s.opponent.field.splice(idx, 1);
  s.opponent.hand.push(unit);
  log(s, `     Floor It: returned ${unit.name} to rival's hand`);
  return s;
}

/**
 * p3 — Industrial Assembly: Increase a friendly Gig's value by 4. If 7+ ★, draw a card.
 */
export function resolveIndustrialAssembly(state, gigId) {
  const s = state;
  const gig = s.player.gigDice.find(d => d.id === gigId);
  if (!gig) return s;
  gig.value = Math.min(gig.value + 4, gig.sides);
  log(s, `     Industrial Assembly: Gig boosted to ${gig.value}`);
  if (s.player.streetCred >= 7 && s.player.deck.length) {
    s.player.hand.push(s.player.deck.pop());
    log(s, `     Drew a card (7+ ★)`);
  }
  return s;
}

/**
 * p4 — Afterparty at Lizzie's: Adjust a rival Gig's value by ±2. If a friendly Gig matches, draw a card.
 */
export function resolveAfterparyAdjustment(state, gigIndex, adjustment) {
  const s = state;
  const gig = s.opponent.gigDice[gigIndex];
  if (!gig) return s;
  gig.value = Math.max(1, Math.min(gig.sides, gig.value + adjustment));
  log(s, `     Afterparty: rival Gig adjusted to ${gig.value}`);
  const matches = s.player.gigDice.some(d => d.value === gig.value);
  if (matches && s.player.deck.length) {
    s.player.hand.push(s.player.deck.pop());
    log(s, `     Gig matched! Drew a card`);
  }
  return s;
}

/**
 * p5 — Cyberpsychosis: Give an equipped Unit +2 Power per Gear this turn. Defeat at end of turn.
 */
export function resolveCyberpsychosis(state, targetUid) {
  const s = state;
  const unit = s.player.field.find(u => u.uid === targetUid);
  if (!unit) return s;
  const gearCount = (unit.gear || []).length;
  unit.powerBonus = (unit.powerBonus || 0) + gearCount * 2;
  unit.defeatedAtEndOfTurn = true;
  log(s, `     Cyberpsychosis: ${unit.name} gains +${gearCount * 2} Power (defeated at end of turn)`);
  return s;
}

/**
 * p7 — Corporate Surveillance: Spend a rival Unit with cost 3 or less.
 */
export function resolveCorporateSurveillance(state, targetUid) {
  const s = state;
  const unit = s.opponent.field.find(u => u.uid === targetUid && (u.cost || 0) <= 3);
  if (!unit) return s;
  unit.spent = true;
  log(s, `     Corporate Surveillance: ${unit.name} is now spent`);
  return s;
}

// =========================
// GIG EFFECTS
// =========================

/**
 * Steal a Gig from the opponent.
 */
export function resolveGigSteal(state, gigId) {
  const s = state;
  const idx = s.opponent.gigDice.findIndex(d => d.id === gigId);
  if (idx === -1) return s;
  const [gig] = s.opponent.gigDice.splice(idx, 1);
  s.player.gigDice.push({ ...gig, id: uid() });
  log(s, `     Stole a Gig (value: ${gig.value})`);
  return s;
}

/**
 * Boost a friendly Gig's value by a given amount.
 */
export function resolveGigBoost(state, gigId, amount) {
  const s = state;
  const gig = s.player.gigDice.find(d => d.id === gigId);
  if (!gig) return s;
  gig.value = Math.min(gig.value + amount, gig.sides);
  log(s, `     Gig boosted to ${gig.value}`);
  return s;
}

// =========================
// COMBAT EFFECTS
// =========================

/**
 * Defeat a unit and move it to trash.
 */
export function defeatUnit(state, playerKey, unitUid) {
  const s = state;
  const p = s[playerKey];
  const idx = p.field.findIndex(u => u.uid === unitUid);
  if (idx === -1) return s;
  const [unit] = p.field.splice(idx, 1);
  p.trash.push(unit);
  log(s, `     ${unit.name} was defeated`);
  return s;
}

/**
 * Apply end-of-turn cleanup (defeat units marked for defeat, etc.)
 */
export function applyEndOfTurnCleanup(state) {
  const s = state;
  const toDefeat = s.player.field.filter(u => u.defeatedAtEndOfTurn).map(u => u.uid);
  toDefeat.forEach(uid => defeatUnit(s, 'player', uid));
  return s;
}

// =========================
// EFFECT REGISTRY
// =========================

export const CARD_EFFECTS = {

  rebootOptics: (state, owner, card, targetUid) =>
    resolveRebootOptics(state, targetUid),

  floorIt: (state, owner, card, targetUid) =>
    resolveFloorIt(state, targetUid),

p3: (state, owner, card, gigId) =>
  resolveIndustrialAssembly(state, gigId),

  afterparty: (state, owner, card, gigIndex, adjustment) =>
    resolveAfterparyAdjustment(state, gigIndex, adjustment),

  cyberpsychosis: (state, owner, card, targetUid) =>
    resolveCyberpsychosis(state, targetUid),

  corporateSurveillance: (state, owner, card, targetUid) =>
    resolveCorporateSurveillance(state, targetUid),

  stealGig: (state, owner, card, gigId) =>
    resolveGigSteal(state, gigId),

  boostGig: (state, owner, card, gigId) =>
    resolveGigBoost(state, gigId, 4)

};