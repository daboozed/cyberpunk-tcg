import { PROGRAMS_POOL } from '@/lib/cardPool';

export class ProgramResolver {
  static resolveProgram(state, cardId, targetUid = null) {
    const effect = this.getProgramEffect(cardId);
    if (!effect) return state;

    const s = structuredClone(state);
    const p = s.player;
    const opp = s.opponent;

    // Find target(s) based on effect definition
    const target = this.findTarget(effect, p, opp, targetUid);
    if (!target && effect.targets !== 'none') {
      console.warn(`No valid target for program ${cardId}`);
      return s;
    }

    // Execute each action in sequence
    for (const action of effect.actions) {
  this.executeAction(s, action, p, opp, target);

  // 🧠 NEW: interrupt flow if we enter spend mode
  if (s.pendingSpend) {
    return s;
  }
}

    // Evaluate conditional (if/then)
    if (effect.conditional) {
      if (this.evaluateCondition(s, effect.conditional, p, opp)) {
        this.executeAction(s, effect.conditional.action, p, opp, target);
      }
    }

    return s;
  }

  static findTarget(effect, player, opponent, targetUid) {
    const { targets, filter } = effect;

    if (targets === 'anyUnit') {
      if (targetUid) {
        const friendlyTarget = player.field.find(u => u.uid === targetUid);
        if (friendlyTarget) return { unit: friendlyTarget, owner: 'player' };
        const rivalTarget = opponent.field.find(u => u.uid === targetUid);
        if (rivalTarget) return { unit: rivalTarget, owner: 'opponent' };
      }
      let candidates = [
        ...player.field.map(u => ({ unit: u, owner: 'player' })),
        ...opponent.field.map(u => ({ unit: u, owner: 'opponent' }))
      ];
      if (filter?.status === 'spent') {
        candidates = candidates.filter(c => c.unit.spent);
      }
      if (filter?.maxCost !== undefined) {
        candidates = candidates.filter(c => (c.unit.cost || 0) <= filter.maxCost);
      }
      return candidates.length > 0 ? candidates[0] : null;
    }

    if (targets === 'friendlyUnit') {
      if (targetUid) return player.field.find(u => u.uid === targetUid);
      // If no target provided, find first eligible unit
      return filter?.mustHaveGear 
        ? player.field.find(u => u.gear && u.gear.length > 0)
        : player.field[0];
    }

    if (targets === "friendlyGig") {
  if (targetUid != null) {
    return (
      player.gigDice.find(g => g.id === targetUid) ||
      player.gigDice.find((_, i) => String(i) === String(targetUid)) ||
      null
    );
  }

  return player.gigDice[0] || null;
}

    if (targets === 'rivalUnit') {
      if (targetUid) return opponent.field.find(u => u.uid === targetUid);
      // Filter by constraints
      let candidates = opponent.field;
      if (filter?.status === 'spent') {
        candidates = candidates.filter(u => u.spent);
      }
      if (filter?.maxCost !== undefined) {
        candidates = candidates.filter(u => (u.cost || 0) <= filter.maxCost);
      }
      return candidates.length > 0 ? candidates[0] : null;
    }

    if (targets === 'rivalGig') {
      return opponent.gigDice[0];
    }

    return null;
  }

  static executeAction(state, action, player, opponent, target) {
    const { type } = action;

    if (type === 'buff') {
      if (target) {
        target.powerBonus = (target.powerBonus || 0) + action.amount;
        if (action.duration === 'thisTurn') {
          // Flag for cleanup at end of turn
          target.tempBuff = action.amount;
        }
      }
    }

    if (type === 'scheduleDefeat') {
      if (target) {
        target.scheduledDefeat = action.timing;
      }
    }

    if (type === 'returnToHand') {
      if (target) {
        const { unit, owner } = target;
        const field = owner === 'player' ? player.field : opponent.field;
        const hand = owner === 'player' ? player.hand : opponent.hand;
        const idx = field.findIndex(u => u.uid === unit.uid);
        if (idx >= 0) {
          const [u] = field.splice(idx, 1);
          hand.push(u);
        }
      }
    }

    if (type === 'adjustGig') {
      if (target) {
        if (action.range) {
          // Will be handled by caller with choice modal
          target.pendingAdjustment = action.range;
        } else if (action.amount !== undefined) {
          const newVal = Math.max(1, Math.min(target.sides, (target.value || 0) + action.amount));
          target.value = newVal;
            state.combatLog = state.combatLog || [];
            state.combatLog.push( `Industrial Assembly increased Gig by +${action.amount}.`
);        }
      }
    }

    if (type === 'scalingBuff') {
      if (target && target.gear) {
        const gearCount = target.gear.length;
        const totalBonus = action.baseAmount * gearCount;
        target.powerBonus = (target.powerBonus || 0) + totalBonus;
        if (action.duration === 'thisTurn') {
          target.tempBuff = totalBonus;
        }
      }
    }

    if (type === 'spend') {
      if (target) {
        target.spent = true;
      }
    }

if (type === 'enterSpendMode') {
  state.pendingSpend = {
    targets: action.targets || 'friendlyUnit',
    filter: action.filter || null,
    source: action.source || null
  };
}

    if (type === 'drawCard') {
      if (player.deck.length > 0) {
        player.hand.push(player.deck.shift());
      }
    }
  }

  static evaluateCondition(state, condition, player, opponent) {
    const { type, threshold, compareTo } = condition;

    if (type === 'streetCredCheck') {
      const cred = player.streetCred || 0;
      return cred >= threshold;
    }

    if (type === 'gigValueMatch') {
      // Check if any friendly gig matches a rival gig value
      const rivalGigs = opponent.gigDice || [];
      const friendlyGigs = player.gigDice || [];
      return rivalGigs.some(rg => friendlyGigs.some(fg => fg.value === rg.value));
    }

    return false;
  }
}