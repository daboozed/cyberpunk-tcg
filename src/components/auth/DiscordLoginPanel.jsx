import { useEffect, useState } from "react";

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || "http://localhost:3001";

function getStoredDisplayName(user) {
  if (!user?.id) return "";

  return (
    localStorage.getItem(`cpTCG_displayName_${user.id}`) ||
    user.globalName ||
    user.username ||
    ""
  );
}

export default function DiscordLoginPanel() {
  const [discordUser, setDiscordUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const applyUser = (user) => {
    setDiscordUser(user);
    setDisplayName(getStoredDisplayName(user));
  };

  const fetchDiscordUser = async () => {
    try {
      const res = await fetch(`${AUTH_SERVER}/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        applyUser(null);
        return;
      }

      const data = await res.json();
      applyUser(data.user || null);
    } catch {
      applyUser(null);
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

  const handleDisplayNameChange = (value) => {
    setDisplayName(value);

    if (discordUser?.id) {
      localStorage.setItem(`cpTCG_displayName_${discordUser.id}`, value);
    }
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

    applyUser(null);
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
      <div className="flex items-center gap-2">
        <input
          value={displayName}
          onChange={(event) => handleDisplayNameChange(event.target.value)}
          aria-label="Editable player username"
          className="h-9 min-w-0 flex-1 rounded-md border border-cyan-500/30 bg-black/35 px-3 text-sm font-semibold text-cyan-200 outline-none transition placeholder:text-cyan-200/30 focus:border-cyan-300 focus:shadow-[0_0_10px_rgba(34,211,238,0.35)]"
          placeholder="Choose username"
          maxLength={24}
        />

        <button
          onClick={handleLogout}
          className="h-9 shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-300 transition-all duration-200 hover:bg-red-500/20"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
