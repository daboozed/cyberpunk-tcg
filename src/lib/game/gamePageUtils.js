import { GIG_DICE } from "@/lib/cardPool";

export function getOrCreatePlayerId() {
  let id = localStorage.getItem("cpTCG_playerId");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
    localStorage.setItem("cpTCG_playerId", id);
  }
  return id;
}

export function flipState(gs) {
  const flipped = { ...gs, player: gs.opponent, opponent: gs.player };
  if (flipped.winner === "player") flipped.winner = "opponent";
  else if (flipped.winner === "opponent") flipped.winner = "player";
  return flipped;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makePlayerState(deck, owner) {
  return {
    legends: shuffle([...deck.legends]),
    deck: shuffle([...deck.mainDeck]),
    hand: [],
    field: [],
    eddies: [],
    trash: [],
    gigDice: [],
    fixerArea: GIG_DICE.map((d, i) => ({ ...d, id: `${owner}_die_${i}` })),
    streetCred: 0,
  };
}
