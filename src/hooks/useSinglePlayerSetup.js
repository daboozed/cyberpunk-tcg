import { useEffect } from "react";
import { buildCustomDeck, LEGENDS_POOL, UNITS_POOL, PROGRAMS_POOL, GEAR_POOL } from "@/lib/cardPool";
import {
  createInitialState,
  setupGame,
  PHASES,
} from "@/lib/engine/gameEngine";

const ALL_POOL_CARDS = [...LEGENDS_POOL, ...UNITS_POOL, ...PROGRAMS_POOL, ...GEAR_POOL];

function getPoolCardName(cardId) {
  return ALL_POOL_CARDS.find((card) => String(card.id) === String(cardId))?.name;
}

function withApiData(mainDeck, cardMap) {
  return (mainDeck || []).map((entry) => {
    const name = entry.name || getPoolCardName(entry.id);

    return {
      ...entry,
      apiData: name ? cardMap[name.toLowerCase()] : undefined,
    };
  });
}

export function useSinglePlayerSetup({
  isMultiplayer,
  gs,
  cardMap,
  setGs,
}) {
  useEffect(() => {
    if (
      !isMultiplayer &&
      gs.phase === PHASES.SETUP &&
      Object.keys(cardMap).length > 0
    ) {
      try {
        const savedDeck = JSON.parse(
          localStorage.getItem("cpTCG_deck") || "null"
        );

        const playerDeckData = savedDeck || {
          legends: ["l0", "l4", "l3"],
          mainDeck: [
            { id: "g1", count: 3 },
            { id: "g5", count: 2 },
            { id: "g2", count: 2 },
            { id: "p3", count: 3 },
            { id: "p7", count: 3 },
            { id: "u2", count: 3 },
            { id: "u5", count: 2 },
            { id: "u1", count: 3 },
            { id: "u8", count: 3 },
            { id: "u9", count: 2 },
            { id: "u6", count: 1 },
          ],
        };

        const opponentDeckData = {
          legends: ["l11", "l12", "l7"],
          mainDeck: [
            { id: "g3", count: 3 },
            { id: "g4", count: 2 },
            { id: "g6", count: 2 },
            { id: "p2", count: 3 },
            { id: "p1", count: 3 },
            { id: "u10", count: 3 },
            { id: "u15", count: 2 },
            { id: "u16", count: 3 },
            { id: "u3", count: 3 },
            { id: "u7", count: 2 },
            { id: "u4", count: 1 },
          ],
        };

        const pd = buildCustomDeck(
          playerDeckData.legends,
          withApiData(playerDeckData.mainDeck, cardMap),
          0
        );

        const od = buildCustomDeck(
          opponentDeckData.legends,
          withApiData(opponentDeckData.mainDeck, cardMap),
          1
        );

        const initial = createInitialState(pd, od);
        setGs(setupGame(initial));
      } catch (e) {
        console.error("Deck load error", e);
      }
    }
  }, [isMultiplayer, gs.phase, cardMap, setGs]);
}
