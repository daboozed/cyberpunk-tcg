import { useEffect, useState } from "react";

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || "http://localhost:3001";

function getStoredDisplayName(user) {
  if (!user?.id) return "";

  return (
    localStorage.getItem(`cpTCG_displayName_${user.id}`) ||
    localStorage.getItem("cpTCG_playerName") ||
    user.globalName ||
    user.username ||
    ""
  );
}

function getDiscordName(user) {
  return user?.globalName || user?.username || "Discord User";
}

export default function DiscordLoginPanel() {
  const [discordUser, setDiscordUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");

  const applyUser = (user) => {
    setDiscordUser(user);

    if (!user) {
      setDisplayName("");
      return;
    }

    const storedDisplayName = getStoredDisplayName(user);
    setDisplayName(storedDisplayName);

    if (storedDisplayName.trim()) {
      localStorage.setItem("cpTCG_playerName", storedDisplayName.trim());
    }
  };

  const fetchDiscordUser = async () => {
    try {
      setAuthError("");

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
      setAuthError("Could not reach Discord login server.");
    } finally {
      setAuthLoading(false);
      setAuthStatus("");
    }
  };

  useEffect(() => {
    fetchDiscordUser();

    const onMessage = (event) => {
      if (event.origin !== AUTH_SERVER) return;

      if (event.data?.type === "DISCORD_LOGIN_SUCCESS") {
        setAuthStatus("Discord connected. Loading profile...");
        fetchDiscordUser();
      }
    };

    const onFocus = () => {
      fetchDiscordUser();
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleLogin = () => {
    setAuthError("");
    setAuthStatus("Opening Discord login...");

    window.open(
      `${AUTH_SERVER}/auth/discord`,
      "discordLogin",
      "width=520,height=720"
    );
  };

  const handleDisplayNameChange = (value) => {
    setDisplayName(value);

    const nextName = value.trim();

    if (discordUser?.id) {
      localStorage.setItem(`cpTCG_displayName_${discordUser.id}`, value);
    }

    if (nextName) {
      localStorage.setItem("cpTCG_playerName", nextName);
    } else {
      localStorage.removeItem("cpTCG_playerName");
    }
  };

  const handleLogout = async () => {
    setAuthStatus("Logging out...");
    setAuthError("");

    try {
      await fetch(`${AUTH_SERVER}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors and clear local UI state.
    }

    localStorage.removeItem("cpTCG_playerName");
    applyUser(null);
    setAuthStatus("");
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
      <div className="space-y-2">
        <button
          onClick={handleLogin}
          className="h-10 w-full rounded-lg border border-white/20 bg-white/10 transition-all duration-200 hover:border-cyan-400/70 hover:bg-white/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]"
        >
          Login With Discord
        </button>

        {authStatus ? (
          <div className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
            {authStatus}
          </div>
        ) : null}

        {authError ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {authError}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">
            Discord Connected
          </div>
          <div className="truncate text-sm font-semibold text-cyan-100">
            {getDiscordName(discordUser)}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="h-8 shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-3 text-xs text-red-300 transition-all duration-200 hover:bg-red-500/20"
        >
          Logout
        </button>
      </div>

      <label className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-cyan-200/50">
        Player Name
      </label>

      <input
        value={displayName}
        onChange={(event) => handleDisplayNameChange(event.target.value)}
        aria-label="Editable player username"
        className="h-9 w-full rounded-md border border-cyan-500/30 bg-black/35 px-3 text-sm font-semibold text-cyan-200 outline-none transition placeholder:text-cyan-200/30 focus:border-cyan-300 focus:shadow-[0_0_10px_rgba(34,211,238,0.35)]"
        placeholder="Choose username"
        maxLength={24}
      />

      <div className="mt-2 text-[11px] text-cyan-100/50">
        This name will be used when you enter the game.
      </div>
    </div>
  );
}
