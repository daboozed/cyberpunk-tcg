import { useEffect, useState } from "react";
import { fetchCards } from "../data/cardService";

export function useCardData() {
  const [cards, setCards] = useState([]);
  const [cardMap, setCardMap] = useState({});

  useEffect(() => {
    fetchCards().then(cards => {
      console.log("LOADED CARDS:", cards);

      setCards(cards);

      const map = Object.fromEntries(
        cards.map(c => [c.name.toLowerCase(), c])
      );
      setCardMap(map);
    });
  }, []);

  return { cards, cardMap };
}
