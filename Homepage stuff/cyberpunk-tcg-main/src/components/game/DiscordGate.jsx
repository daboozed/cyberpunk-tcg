import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const CONNECTOR_ID = '69c9edfe59d419166d4663f5';

export default function DiscordGate({ children }) {
  const [status, setStatus] = useState("loading"); // loading | unauthenticated | disconnected | connected
  const [discordUser, setDiscordUser] = useState(null);

  const fetchDiscordUser = async () => {
    try {
      const res = await base44.functions.invoke("discordAuth", {});
      if (res.data?.connected) {
        setDiscordUser(res.data);
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (!authed) {
        setStatus("unauthenticated");
        return;
      }
      await fetchDiscordUser();
    });
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchDiscordUser();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setDiscordUser(null);
    setStatus("disconnected");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#5865F2]/30 border-t-[#5865F2] rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="font-rajdhani text-muted-foreground">You must be signed in to use the Deck Builder.</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-rajdhani">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-[#5865F2]/40 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-[#5865F2]/10 space-y-5">
          {/* Discord logo */}
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/40">
              <svg viewBox="0 0 24 24" className="w-9 h-9 fill-white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </div>
          </div>

          <div>
            <h2 className="font-orbitron text-xl font-bold text-white tracking-wider mb-1">Connect Discord</h2>
            <p className="font-rajdhani text-muted-foreground text-sm">
              Link your Discord account to access the <span className="text-[#5865F2] font-bold">Deck Builder</span>.
            </p>
          </div>

          <Button
            onClick={handleConnect}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-rajdhani font-bold text-base h-11 gap-2 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Login with Discord
          </Button>
        </div>
      </div>
    );
  }

  // Connected — render children with a small connected badge in top-right
  return (
    <div className="relative">
      {discordUser && (
        <div className="absolute top-3 right-16 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40">
          {discordUser.avatar && (
            <img src={discordUser.avatar} alt="avatar" className="w-5 h-5 rounded-full" />
          )}
          <span className="text-[11px] font-mono text-[#5865F2] font-bold">{discordUser.username}</span>
          <button onClick={handleDisconnect} className="text-[10px] font-mono text-muted-foreground hover:text-destructive ml-1 transition-colors">✕</button>
        </div>
      )}
      {children}
    </div>
  );
}