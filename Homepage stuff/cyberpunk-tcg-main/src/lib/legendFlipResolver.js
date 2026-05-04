export function resolveLegendFlip(state, legend) {
  const s = structuredClone(state);

  const effects = {
    // Viktor Vektor
    l7: (gs) => {
      const top5 = gs.player.deck.splice(0, 5);

      gs.pendingLegendFlip = {
        type: "viktor_search",
        cards: top5,
        selected: []
      };

      return gs;
    }
  };

  if (effects[legend.id]) {
    return effects[legend.id](s);
  }

  return s;
}