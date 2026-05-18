import { useEffect, useState } from "react";
import { fetchCards } from "../data/cardService";

export function useCardData() {
  const [cards, setCards] = useState([]);
  const [cardMap, setCardMap] = useState({});

  useEffect(() => {
    fetchCards().then(cards => {
      const uniqueCards = Array.from(
        new Map(
          cards.map(card => [
           `${card.id || card.name}-${card.type}`,
        card
      ])
    ).values()
  );

  setCards(uniqueCards);

  const map = Object.fromEntries(
    uniqueCards.map(c => [
      `${c.name.toLowerCase()}-${c.type}`,
      c
    ])
  );

  setCardMap(map);
});
}, []);

  return { cards, cardMap };
}
