import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Copy, Check, Clock, Users, Swords, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem('cpTCG_playerId');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
    localStorage.setItem('cpTCG_playerId', id);
  }
  return id;
}

export default function Lobby() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'host';

  const [roomCode, setRoomCode] = useState(() => mode === 'host' ? generateCode() : '');
  const [timeLeft, setTimeLeft] = useState(30);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [status, setStatus] = useState('creating'); // 'creating' | 'waiting' | 'connected'

  const roomEntityIdRef = useRef(null);
  const unsubRef = useRef(null);

  // HOST: create the room entity on mount
  useEffect(() => {
    if (mode !== 'host') return;

    const myId = getOrCreatePlayerId();
    const deck = localStorage.getItem('cpTCG_deck');
    const code = roomCode;

    base44.entities.Room.create({
      room_code: code,
      host_name: 'Player 1',
      status: 'waiting',
      player1_id: myId,
      host_deck: deck || '',
      code_expires_at: Date.now() + 300000,
    }).then(room => {
      roomEntityIdRef.current = room.id;
      setStatus('waiting');

      // Subscribe to room changes — navigate when guest joins
      const unsub = base44.entities.Room.subscribe(event => {
        if (event.id !== room.id) return;
        if (event.data?.player2_id) {
          unsub();
          navigate(`/play?roomId=${room.id}`);
        }
      });
      unsubRef.current = unsub;
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [mode]);

  // HOST: rotate code every 30s
  useEffect(() => {
    if (mode !== 'host') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const newCode = generateCode();
          setRoomCode(newCode);
          if (roomEntityIdRef.current) {
            base44.entities.Room.update(roomEntityIdRef.current, { room_code: newCode });
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 8) {
      setJoinError('Code must be exactly 8 characters.');
      return;
    }

    setJoinLoading(true);
    setJoinError('');

    const rooms = await base44.entities.Room.filter({ room_code: code, status: 'waiting' });

    if (!rooms || rooms.length === 0) {
      setJoinError('Room not found or already started. Check the code and try again.');
      setJoinLoading(false);
      return;
    }

    const room = rooms[0];
    const myId = getOrCreatePlayerId();
    const deck = localStorage.getItem('cpTCG_deck');

    await base44.entities.Room.update(room.id, {
      player2_id: myId,
      guest_name: 'Player 2',
      guest_deck: deck || '',
      status: 'playing',
    });

    navigate(`/play?roomId=${room.id}`);
  };

  const handleCancel = async () => {
    if (roomEntityIdRef.current) {
      await base44.entities.Room.delete(roomEntityIdRef.current).catch(() => {});
    }
    navigate('/');
  };

  const timerColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-amber-400' : 'text-green-400';
  const timerBg = timeLeft <= 10 ? 'bg-red-500/20 border-red-500/50' : timeLeft <= 20 ? 'bg-amber-500/20 border-amber-500/50' : 'bg-green-500/20 border-green-500/50';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(190 100% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50% / 0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors font-rajdhani text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {mode === 'host' ? (
          <div className="bg-card/90 border border-primary/30 rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-primary/10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-orbitron text-2xl font-bold text-primary tracking-wider">WAITING ROOM</h1>
              <p className="text-sm font-rajdhani text-muted-foreground mt-1">Share this code with another player to join your game</p>
            </div>

            {status === 'creating' ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-3 font-rajdhani text-muted-foreground">Creating room...</span>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">Room Code</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background/60 border border-primary/40 rounded-xl p-4 text-center">
                      <span className="font-orbitron text-3xl font-black text-primary tracking-[0.3em] select-all">
                        {roomCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-primary"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className={cn("flex items-center justify-center gap-2 px-4 py-2 rounded-lg border mb-6 mx-auto w-fit", timerBg)}>
                  <Clock className={cn("w-4 h-4", timerColor)} />
                  <span className={cn("font-mono text-sm font-bold", timerColor)}>
                    New code in {timeLeft}s
                  </span>
                </div>

                <div className="flex gap-2 mb-8 justify-center">
                  {roomCode.split('').map((char, i) => (
                    <div key={i} className="w-9 h-11 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center">
                      <span className="font-orbitron font-bold text-base text-primary">{char}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border/40 mb-6">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <span className="font-rajdhani text-sm text-muted-foreground">Waiting to be connected...</span>
                </div>

                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full font-rajdhani border-muted-foreground/30 text-muted-foreground"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-card/90 border border-secondary/30 rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-secondary/10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-secondary/10 border-2 border-secondary/30 flex items-center justify-center mx-auto mb-4">
                <Swords className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="font-orbitron text-2xl font-bold text-secondary tracking-wider">JOIN ROOM</h1>
              <p className="text-sm font-rajdhani text-muted-foreground mt-1">Enter the 8-character room code</p>
            </div>

            <div className="mb-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-center mb-3">Room Code</p>
              <input
                type="text"
                value={joinCode}
                onChange={e => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                  setJoinCode(val);
                  setJoinError('');
                }}
                placeholder="XXXXXXXX"
                maxLength={8}
                className="w-full bg-background/60 border border-secondary/40 rounded-xl p-4 text-center font-orbitron text-2xl font-bold text-secondary tracking-[0.3em] placeholder:text-muted-foreground/30 placeholder:tracking-widest outline-none focus:border-secondary/70"
              />
              {joinError && (
                <p className="text-xs text-destructive font-mono mt-2 text-center">{joinError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1 font-rajdhani border-muted-foreground/30 text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                disabled={joinCode.length !== 8 || joinLoading}
                className="flex-1 font-rajdhani bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 gap-2 disabled:opacity-40"
              >
                {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                Join Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}