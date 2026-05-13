import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Copy, Loader2, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const ROOM_CODE_LENGTH = 8;

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem("cpTCG_playerId");

  if (!id) {
    id =
      Math.random().toString(36).slice(2, 10).toUpperCase() +
      Date.now().toString(36).toUpperCase();
    localStorage.setItem("cpTCG_playerId", id);
  }

  return id;
}

function getPlayerName(fallback = "Player") {
  return localStorage.getItem("cpTCG_playerName") || fallback;
}

function getSavedDeck() {
  return localStorage.getItem("cpTCG_deck") || "";
}

function getDeckName() {
  try {
    const deck = JSON.parse(getSavedDeck() || "null");
    return deck?.name || "No deck loaded";
  } catch {
    return "No deck loaded";
  }
}

function getLobbyMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "join" ? "join" : "host";
}

function normalizeJoinCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}

export default function Lobby() {
  const navigate = useNavigate();
  const mode = getLobbyMode();
  const playerName = getPlayerName(mode === "host" ? "Player 1" : "Player 2");
  const deckName = getDeckName();
  const hasDeck = deckName !== "No deck loaded";

  const [roomCode, setRoomCode] = useState(() => (mode === "host" ? generateCode() : ""));
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [status, setStatus] = useState(mode === "host" ? "creating" : "idle");
  const [hostError, setHostError] = useState("");

  const roomEntityIdRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (mode !== "host") return undefined;

    let cancelled = false;

    const createRoom = async () => {
      try {
        setHostError("");
        setStatus("creating");

        const myId = getOrCreatePlayerId();
        const deck = getSavedDeck();
        const code = roomCode;

        const room = await base44.entities.Room.create({
          room_code: code,
          host_name: playerName,
          status: "waiting",
          player1_id: myId,
          host_deck: deck,
          code_expires_at: Date.now() + 10 * 60 * 1000,
        });

        if (cancelled) return;

        roomEntityIdRef.current = room.id;
        setStatus("waiting");

        const unsub = base44.entities.Room.subscribe((event) => {
          if (event.id !== room.id) return;

          if (event.data?.player2_id) {
            if (unsubRef.current) unsubRef.current();
            navigate(`/game?mode=online&roomId=${room.id}`);
          }
        });

        unsubRef.current = unsub;
      } catch (err) {
        console.error("Failed to create room", err);
        if (!cancelled) {
          setStatus("error");
          setHostError("Could not create a room. Try again in a moment.");
        }
      }
    };

    createRoom();

    return () => {
      cancelled = true;
      if (unsubRef.current) unsubRef.current();
    };
  }, [mode, navigate, playerName, roomCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    const code = normalizeJoinCode(joinCode);

    if (code.length !== ROOM_CODE_LENGTH) {
      setJoinError(`Code must be exactly ${ROOM_CODE_LENGTH} characters.`);
      return;
    }

    setJoinLoading(true);
    setJoinError("");

    try {
      const rooms = await base44.entities.Room.filter({
        room_code: code,
        status: "waiting",
      });

      if (!rooms || rooms.length === 0) {
        setJoinError("Room not found or already started. Check the code and try again.");
        return;
      }

      const room = rooms[0];
      const myId = getOrCreatePlayerId();
      const deck = getSavedDeck();

      await base44.entities.Room.update(room.id, {
        player2_id: myId,
        guest_name: playerName,
        guest_deck: deck,
        status: "playing",
      });

      navigate(`/game?mode=online&roomId=${room.id}`);
    } catch (err) {
      console.error("Failed to join room", err);
      setJoinError("Could not join this room. Try again in a moment.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCancel = async () => {
    if (roomEntityIdRef.current) {
      await base44.entities.Room.delete(roomEntityIdRef.current).catch(() => {});
    }

    navigate("/home");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(hsl(190 100% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50% / 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/home"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="mb-4 rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-white/55">
          <div className="flex items-center justify-between gap-3">
            <span>Player</span>
            <span className="font-semibold text-cyan-200">{playerName}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Deck</span>
            <span className={cn("font-semibold", hasDeck ? "text-green-300" : "text-yellow-200")}>
              {deckName}
            </span>
          </div>
        </div>

        {mode === "host" ? (
          <div className="rounded-2xl border border-primary/30 bg-card/90 p-8 shadow-2xl shadow-primary/10 backdrop-blur-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-wider text-primary">WAITING ROOM</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Share this code with another player to join your game.
              </p>
            </div>

            {status === "creating" ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Creating room...</span>
              </div>
            ) : status === "error" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {hostError}
                </div>
                <Button variant="outline" onClick={() => navigate("/home")} className="w-full">
                  Back to Home
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="mb-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
                    Room Code
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border border-primary/40 bg-background/60 p-4 text-center">
                      <span className="select-all text-3xl font-black tracking-[0.3em] text-primary">
                        {roomCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-primary transition-colors hover:bg-primary/20"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 px-4 py-3">
                  <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-sm text-muted-foreground">
                    Waiting for another player...
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full border-muted-foreground/30 text-muted-foreground"
                >
                  Cancel Room
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-secondary/30 bg-card/90 p-8 shadow-2xl shadow-secondary/10 backdrop-blur-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary/30 bg-secondary/10">
                <Swords className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold tracking-wider text-secondary">JOIN ROOM</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the 8-character room code.
              </p>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-center text-xs uppercase tracking-widest text-muted-foreground">
                Room Code
              </p>
              <input
                type="text"
                value={joinCode}
                onChange={(event) => {
                  setJoinCode(normalizeJoinCode(event.target.value));
                  setJoinError("");
                }}
                placeholder="XXXXXXXX"
                maxLength={ROOM_CODE_LENGTH}
                className="w-full rounded-xl border border-secondary/40 bg-background/60 p-4 text-center text-2xl font-bold tracking-[0.3em] text-secondary placeholder:text-muted-foreground/30 outline-none focus:border-secondary/70"
              />
              {joinError ? (
                <p className="mt-2 text-center text-xs text-destructive">{joinError}</p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/home")}
                className="flex-1 border-muted-foreground/30 text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                disabled={!hasDeck || joinCode.length !== ROOM_CODE_LENGTH || joinLoading}
                className="flex-1 gap-2 border border-secondary/50 bg-secondary/20 text-secondary hover:bg-secondary/30 disabled:opacity-40"
              >
                {joinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
                Join Game
              </Button>
            </div>

            {!hasDeck ? (
              <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-center text-xs text-yellow-100/80">
                Load a deck before joining a room.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
