// Data-driven program effect definitions
// Add new programs by adding objects here—no code changes needed

export const PROGRAM_EFFECTS = {
  p1: {
    // Reboot Optics: +4 Power this turn, defeat at end
    id: 'p1',
    name: 'Reboot Optics',
    targets: 'friendlyUnit',
    actions: [
      { type: 'buff', amount: 4, duration: 'thisTurn' },
      { type: 'scheduleDefeat', timing: 'endOfTurn' }
    ]
  },

  p2: {
    // Floor It: Return a spent friendly or rival unit (cost ≤ 4) to hand
    id: 'p2',
    name: 'Floor It',
    targets: 'anyUnit',
    filter: { status: 'spent', maxCost: 4 },
    actions: [
      { type: 'returnToHand' }
    ]
  },

  p3: {
    // Industrial Assembly: +4 Gig value, draw if 7+ streetCred
    id: 'p3',
    name: 'Industrial Assembly',
    targets: 'friendlyGig',
    actions: [
      { type: 'adjustGig', amount: 4 }
    ],
    conditional: { type: 'streetCredCheck', threshold: 7, action: { type: 'drawCard' } }
  },

  p4: {
    // Afterparty at Lizzie's: Adjust rival gig ±2, draw if matches friendly
    id: 'p4',
    name: "Afterparty at Lizzie's",
    targets: 'rivalGig',
    actions: [
      { type: 'adjustGig', range: [-2, 2], requiresChoice: true }
    ],
    conditional: { type: 'gigValueMatch', compareTo: 'friendlyGigs', action: { type: 'drawCard' } }
  },

  p5: {
    // Cyberpsychosis: +2 Power per equipped gear, defeat at end
    id: 'p5',
    name: 'Cyberpsychosis',
    targets: 'friendlyUnit',
    filter: { mustHaveGear: true },
    actions: [
      { type: 'scalingBuff', baseAmount: 2, scaleBy: 'gearCount', duration: 'thisTurn' },
      { type: 'scheduleDefeat', timing: 'endOfTurn' }
    ]
  },

  p7: {
    // Corporate Surveillance: Spend a rival unit (cost ≤ 3)
    id: 'p7',
    name: 'Corporate Surveillance',
    targets: 'rivalUnit',
    filter: { maxCost: 3 },
    actions: [
      { type: 'spend' }
    ]
  }
};

export function getProgramEffect(cardId) {
  return PROGRAM_EFFECTS[cardId] || null;
}