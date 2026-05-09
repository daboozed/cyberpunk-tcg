import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  createInitialState,
  setupGame,
  mulligan,
  PHASES,
} from "@/lib/engine/gameEngine";
import { buildCustomDeck } from "@/lib/cardPool";
import {
  getOrCreatePlayerId,
  flipState,
  makePlayerState,
} from "@/lib/game/gamePageUtils";

export function useMultiplayerRoomSync({
  isMultiplayer,
  roomId,
  navigate,
  setGs,
}) {
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [myPlayerLabel, setMyPlayerLabel] = useState("Player 1");
  const [oppPlayerLabel, setOppPlayerLabel] = useState("Player 2");
  const myRoleRef = useRef(null);
  const roomEntityIdRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!isMultiplayer) return;

    const setup = async () => {
      const myId = getOrCreatePlayerId();
      roomEntityIdRef.current = roomId;

      const rooms = await base44.entities.Room.filter({ id: roomId });
      if (!rooms || rooms.length === 0) { navigate("/"); return; }
      const room = rooms[0];

      const role = room.player1_id === myId ? "player1" : "player2";
      myRoleRef.current = role;
      setMyPlayerLabel(role === "player1" ? "Player 1" : "Player 2");
      setOppPlayerLabel(role === "player1" ? "Player 2" : "Player 1");

      if (room.game_state) {
        let loadedGs = JSON.parse(room.game_state);
        if (role === "player2") loadedGs = flipState(loadedGs);
        setWaitingForOpponent(loadedGs.whose_turn !== role);
        setGs(loadedGs);
      } else if (role === "player1") {
        const hostDeckData = JSON.parse(room.host_deck || "null");
        const guestDeckData = JSON.parse(room.guest_deck || "null");

        let newGs = createInitialState();
        if (hostDeckData && guestDeckData) {
          const pd = buildCustomDeck(hostDeckData.legends, hostDeckData.mainDeck, 0);
          const od = buildCustomDeck(guestDeckData.legends, guestDeckData.mainDeck, 1);
          newGs.player = makePlayerState(pd, "player");
          newGs.opponent = makePlayerState(od, "opponent");
        }
        newGs.isMultiplayer = true;
        newGs = setupGame(newGs);
        newGs = mulligan(newGs, false);
        newGs.whose_turn = newGs.currentPlayer === "player" ? "player1" : "player2";
        setWaitingForOpponent(newGs.whose_turn !== "player1");

        setGs(newGs);
        await base44.entities.Room.update(roomId, { game_state: JSON.stringify(newGs) });
      } else {
        setWaitingForOpponent(true);
      }

      const unsub = base44.entities.Room.subscribe(event => {
        if (event.id !== roomId) return;
        if (!event.data?.game_state) return;
        const latestGs = JSON.parse(event.data.game_state);
        const isMyTurn = latestGs.whose_turn === myRoleRef.current;
        if (isMyTurn || latestGs.phase === PHASES.GAME_OVER) {
          const displayGs = myRoleRef.current === "player2" ? flipState(latestGs) : latestGs;
          setGs(displayGs);
          setWaitingForOpponent(false);
        }
      });
      unsubRef.current = unsub;
    };

    setup();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [isMultiplayer, navigate, roomId, setGs]);

  const mpSave = useCallback((newGs, switchTurn = false) => {
    if (!isMultiplayer) return;
    const forSave = myRoleRef.current === "player2" ? flipState(newGs) : { ...newGs };
    if (switchTurn) {
      forSave.whose_turn = myRoleRef.current === "player1" ? "player2" : "player1";
    }
    base44.entities.Room.update(roomEntityIdRef.current, { game_state: JSON.stringify(forSave) });
  }, [isMultiplayer]);

  return {
    waitingForOpponent,
    setWaitingForOpponent,
    myPlayerLabel,
    oppPlayerLabel,
    myRoleRef,
    roomEntityIdRef,
    mpSave,
  };
}
