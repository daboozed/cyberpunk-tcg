import { adaptCard } from "./cardAdapter";

export async function fetchCards() {
  const res = await fetch(
    "https://api.netdeck.gg/api/cards/cyberpunk?limit=60&offset=0"
  );

  const json = await res.json();

  console.log("RAW API RESPONSE:", json);

  const cardArray = json.items; // 🔥 FIXED

  return cardArray.map(adaptCard);
}