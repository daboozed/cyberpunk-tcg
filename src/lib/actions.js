// actions.js — Action definitions and resolvers

export function runAction(state, action, source) {

  switch (action.type) {

    case "DRAW":
      draw(state, source.owner, action.amount);
      break;

    case "BOOST_GIG":
      boostGig(state, source.owner, action.amount);
      break;

    case "STEAL_GIG":
      stealGig(state, source.owner, action.amount || 1);
      break;

    case "DESTROY_ALL_OTHER_UNITS":
      destroyAllExcept(state, source.uid);
      break;

  }
}

function draw(state, side, amount) {
  const p = state[side];
  for (let i = 0; i < amount; i++) {
    if (p.deck.length) p.hand.push(p.deck.pop());
  }
}

function boostGig(state, side, amount) {
  const p = state[side];
  if (!p.gigDice.length) return;
  p.gigDice[0].value += amount;
}

function stealGig(state, side, amount) {
  const p = state[side];
  const opp = side === "player" ? state.opponent : state.player;

  for (let i = 0; i < amount; i++) {
    if (!opp.gigDice.length) return;
    p.gigDice.push(opp.gigDice.shift());
  }
}

function destroyAllExcept(state, uid) {
  ["player","opponent"].forEach(side=>{
    state[side].field = state[side].field.filter(u => u.uid === uid);
  });
}