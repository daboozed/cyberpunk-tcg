// effectResolver.js — Card effect resolution logic
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
    s.player.hand.push(s.player.deck.shift());
    log(s, `     Drew a card (7+ ★)`);
  }
  return s;
}

/**
 * p4 — Afterparty at Lizzie's: Adjust a rival Gig's value by ±2. If a friendly Gig matches, draw a card.
 */
export function resolveAfterpartyAdjustment(state, gigIndex, adjustment) {
  const s = state;
  const gig = s.opponent.gigDice[gigIndex];
  if (!gig) return s;
  gig.value = Math.max(1, Math.min(gig.sides, gig.value + adjustment));
  log(s, `     Afterparty: rival Gig adjusted to ${gig.value}`);
  const matches = s.player.gigDice.some(d => d.value === gig.value);
  if (matches && s.player.deck.length) {
    s.player.hand.push(s.player.deck.shift());
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

  const p1 = s.player.field
    .filter(u => u.defeatedAtEndOfTurn)
    .map(u => u.uid);

  const p2 = s.opponent.field
    .filter(u => u.defeatedAtEndOfTurn)
    .map(u => u.uid);

  p1.forEach(uid => defeatUnit(s, "player", uid));
  p2.forEach(uid => defeatUnit(s, "opponent", uid));

  return s;
}

// =========================
// EFFECT REGISTRY
// =========================

export function resolveEffect(effect, ctx) {
  if (!effect || effect.type === "NONE") return ctx.state;

console.log("Resolving:", effect.type, effect);
  
  switch (effect.type) {
    case "PROGRAM_MULTI":
      return resolveProgramMulti(effect, ctx);

      case "GEAR_PASSIVE":
      case "UNIT_PASSIVE":
      case "LEGEND_PASSIVE":
          return ctx.state;

      case "LEGEND_MULTI":
          return resolveProgramMulti(effect, ctx);

      case "UNIT_ACTIVATE":
          return runAction(effect.action, ctx);

      case "RETURN_TO_HAND":
          return resolveFloorIt(ctx.state, ctx.targetUid);

      case "SPEND_RIVAL_UNIT_MAX_COST":
          return resolveCorporateSurveillance(ctx.state, ctx.targetUid);
  
      case "GEAR_TRIGGER":
          return resolveGearTrigger(effect, ctx);

      case "UNIT_TRIGGER":
          return resolveUnitTrigger(effect, ctx);

      case "LEGEND_TRIGGER":
          return resolveLegendTrigger(effect, ctx);

    default:
      console.log("Unhandled effect type:", effect.type);
      return ctx.state;
  }
}

/* -------------------- PROGRAMS -------------------- */

function resolveProgramMulti(effect, ctx) {
  const actions = Array.isArray(effect.action)
    ? effect.action
    : effect.action
      ? [effect.action]
      : [];

  return runActionQueue(actions, ctx);
}

function runActionQueue(actions, ctx, startIndex = 0) {
  for (let i = startIndex; i < actions.length; i++) {
    const result = runAction(actions[i], ctx, actions, i);

    if (result === "PAUSE") {
      return ctx.state;
    }
  }

  return ctx.state;
}

/* -------------------- TRIGGERS -------------------- */

function resolveGearTrigger(effect, ctx) {
  return runAction(effect.action, ctx);
}

function resolveUnitTrigger(effect, ctx) {
  return runAction(effect.action, ctx);
}

function resolveLegendTrigger(effect, ctx) {
  return runAction(effect.action, ctx);
}

/* -------------------- ACTION ENGINE -------------------- */

function runAction(action, ctx, actions = [], index = 0) {
  switch (action) {
    case "BUFF_FRIENDLY_UNIT_4_THIS_TURN":
      resolveRebootOptics(ctx.state, ctx.targetUid);
      break;

    case "BOOST_SELECTED_GIG_4": {
  const targetId =
    ctx.gigId ??
    ctx.state.player.gigDice?.[0]?.id;

  console.log("TARGET GIG ID:", targetId);
  console.log("ALL GIGS BEFORE:", ctx.state.player.gigDice);

  if (targetId) {
    resolveGigBoost(ctx.state, targetId, 4);
  }

  console.log("ALL GIGS AFTER:", ctx.state.player.gigDice);
  break;
}

    case "IF_STARS_7_DRAW_1":
      drawIfStreetCred(ctx, 7, 1);
      break;

    case "PEEK_FRIENDLY_FACEDOWN_LEGEND":
      openPeekLegendModal(ctx);
      return "PAUSE";

    case "DEFEAT_ALL_OTHER_UNITS":
      defeatAllOtherUnits(ctx);
      break;

    case "CHOOSE_FRIENDLY_GIG":
      ctx.setPendingProgram?.({
        type: "chooseFriendlyGig",
        player: ctx.player,
        remainingActions: actions.slice(index + 1)
      });
      return "PAUSE";

    case "CHOOSE_RIVAL_GIG":
      ctx.setPendingProgram?.({
        type: "chooseRivalGig",
        player: ctx.player,
        remainingActions: actions.slice(index + 1)
      });
      return "PAUSE";

    case "CHOOSE_FRIENDLY_UNIT":
      ctx.setPendingProgram?.({
        type: "chooseFriendlyUnit",
        player: ctx.player,
        remainingActions: actions.slice(index + 1)
      });
      return "PAUSE";

    case "CHOOSE_SPENT_UNIT_MAX_4":
      ctx.setPendingProgram?.({
        type: "chooseSpentUnitMax4",
        player: ctx.player,
        remainingActions: actions.slice(index + 1)
      });
      return "PAUSE";

    case "CHOOSE_EQUIPPED_FRIENDLY_UNIT":
      ctx.setPendingProgram?.({
        type: "chooseEquippedFriendlyUnit",
        player: ctx.player,
        remainingActions: actions.slice(index + 1)
      });
      return "PAUSE";

    case "CHOOSE_RIVAL_UNIT_MAX_3":
      ctx.setPendingProgram?.({
        type: "chooseRivalUnitMax3",
        player: ctx.player,
        remainingActions: actions.slice(index + 1)
      });
      return "PAUSE";

    case "ADJUST_SELECTED_GIG_2":
      if (ctx.gigId) {
        const gig = ctx.state.opponent.gigDice.find(g => g.id === ctx.gigId);
        if (gig) {
          gig.value = Math.max(1, Math.min(gig.sides, gig.value + 2));
          log(ctx.state, `     Rival Gig adjusted to ${gig.value}`);
        }
      }
      break;

    case "IF_MATCHING_FRIENDLY_GIG_DRAW_1":
      if (
        ctx.state.player.gigDice.some(
          g => g.value === ctx.state.opponent.gigDice.find(x => x.id === ctx.gigId)?.value
        )
      ) {
        drawIfStreetCred(ctx, 0, 1);
      }
      break;

    case "RETURN_SELECTED_TO_HAND":
      resolveFloorIt(ctx.state, ctx.targetUid);
      break;

    case "BUFF_PER_GEAR_2_THIS_TURN":
      resolveCyberpsychosis(ctx.state, ctx.targetUid);
      break;

    case "SPEND_SELECTED_UNIT":
      resolveCorporateSurveillance(ctx.state, ctx.targetUid);
      break;

    default:
      console.log("Unhandled action:", action);
  }

  return ctx.state;
}

/* -------------------- HELPERS -------------------- */

function drawIfStreetCred(ctx, min, amount) {
  if (ctx.state.player.streetCred >= min) {
    for (let i = 0; i < amount; i++) {
      const card = ctx.state.player.deck.shift();
      if (card) ctx.state.player.hand.push(card);
    }
  }
  return ctx.state;
}

function openPeekLegendModal(ctx) {
  ctx.setPendingProgram?.({
    type: "peekLegend",
    player: ctx.player
  });
  return ctx.state;
}

function defeatAllOtherUnits(ctx) {
  const sourceUid = ctx.sourceUid;
  ctx.state.player.field
    .filter(u => u.uid !== sourceUid)
    .forEach(u => defeatUnit(ctx.state, "player", u.uid));
  ctx.state.opponent.field
    .filter(u => u.uid !== sourceUid)
    .forEach(u => defeatUnit(ctx.state, "opponent", u.uid));
  return ctx.state;
}

export function resumePendingActions(actions, ctx) {
  return runActionQueue(actions, ctx, 0);
}
