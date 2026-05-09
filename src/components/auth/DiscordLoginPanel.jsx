import { useEffect, useState } from "react";

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || "http://localhost:3001";

export default function DiscordLoginPanel() {
  const [discordUser, setDiscordUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchDiscordUser = async () => {
    try {
      const res = await fetch(`${AUTH_SERVER}/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setDiscordUser(null);
        return;
      }

      const data = await res.json();
      setDiscordUser(data.user || null);
    } catch {
      setDiscordUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscordUser();

    const onMessage = (event) => {
      if (event.origin !== AUTH_SERVER) return;

      if (event.data?.type === "DISCORD_LOGIN_SUCCESS") {
        fetchDiscordUser();
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const handleLogin = () => {
    window.open(
      `${AUTH_SERVER}/auth/discord`,
      "discordLogin",
      "width=520,height=720"
    );
  };

  const handleLogout = async () => {
    try {
      await fetch(`${AUTH_SERVER}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors and clear local UI state.
    }

    setDiscordUser(null);
  };

  if (authLoading) {
    return (
      <div className="flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/50">
        Connecting...
      </div>
    );
  }

  if (!discordUser) {
    return (
      <button
        onClick={handleLogin}
        className="h-10 w-full rounded-lg border border-white/20 bg-white/10 transition-all duration-200 hover:border-cyan-400/70 hover:bg-white/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]"
      >
        Login With Discord
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3">
      <div className="flex items-center gap-3">
        {discordUser.avatarUrl && (
          <img
            src={discordUser.avatarUrl}
            alt="Discord profile"
            className="h-10 w-10 rounded-full border border-cyan-400/50"
          />
        )}

        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-semibold text-cyan-300">
            {discordUser.globalName || discordUser.username}
          </div>

          <div className="truncate text-[11px] text-white/50">
            {discordUser.email || discordUser.username}
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="mt-3 h-9 w-full rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 transition-all duration-200 hover:bg-red-500/20"
      >
        Logout
      </button>
    </div>
  );
}
