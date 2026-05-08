import { adaptCard } from "./cardAdapter";

export async function fetchCards() {
  const res = await fetch(
    "https://api.netdeck.gg/api/cards/cyberpunk?limit=60&offset=0"
  );

  const json = await res.json();
  const cardArray = json.items;

  return cardArray.map(adaptCard);
}
