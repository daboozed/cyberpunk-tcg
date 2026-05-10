import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./theme.css";

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || "http://localhost:3001";
const OWNER_DISCORD_IDS = new Set(["458679775997984779"]);

function getDiscordName(user) {
  return user?.globalName || user?.username || "Discord User";
}

function getStoredPlayerName(user) {
  if (!user?.id) return localStorage.getItem("cpTCG_playerName") || "";

  return (
    localStorage.getItem(`cpTCG_displayName_${user.id}`) ||
    localStorage.getItem("cpTCG_playerName") ||
    getDiscordName(user)
  );
}

function InfoCard({ title, value, hint }) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/45 p-4 shadow-[0_0_18px_rgba(34,211,238,0.08)]">
      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/50">
        {title}
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-cyan-100">
        {value || "—"}
      </div>
      {hint ? <div className="mt-2 text-xs text-white/40">{hint}</div> : null}
    </div>
  );
}

function PlaceholderPanel({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
        {title}
      </div>
      <div className="text-sm leading-6 text-white/45">{children}</div>
    </div>
  );
}

export default function Admin() {
  const [authLoading, setAuthLoading] = useState(true);
  const [discordUser, setDiscordUser] = useState(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
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
        setAuthError("Could not reach the Discord auth server.");
        setDiscordUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    loadUser();
  }, []);

  const isOwner = discordUser?.id && OWNER_DISCORD_IDS.has(discordUser.id);
  const playerName = getStoredPlayerName(discordUser);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,.9)), url('/background.webp')",
        }}
      />

      <div className="relative z-10 mx-auto min-h-screen max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/60">
              Neon City Duel
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-cyan-100 md:text-5xl">
              Owner Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/45">
              Phase 2 control center for Discord auth, account status, and future multiplayer moderation tools.
            </p>
          </div>

          <Link
            to="/home"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white/80 transition hover:border-cyan-400/70 hover:bg-white/20"
          >
            Back to Home
          </Link>
        </div>

        {authLoading ? (
          <div className="rounded-xl border border-white/10 bg-black/50 p-6 text-white/60">
            Checking owner access...
          </div>
        ) : !discordUser ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="text-lg font-bold text-red-200">Not logged in</div>
            <p className="mt-2 text-sm text-red-100/70">
              Log in with Discord on the homepage, then return to this admin page.
            </p>
            {authError ? <p className="mt-3 text-xs text-red-100/50">{authError}</p> : null}
          </div>
        ) : !isOwner ? (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <div className="text-lg font-bold text-yellow-100">Access denied</div>
            <p className="mt-2 text-sm text-yellow-100/70">
              This dashboard is limited to the site owner account.
            </p>
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-black/30 p-3 text-xs text-yellow-100/60">
              Signed in as {getDiscordName(discordUser)} ({discordUser.id})
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <InfoCard title="Discord Account" value={getDiscordName(discordUser)} hint="Connected owner profile" />
              <InfoCard title="Discord ID" value={discordUser.id} hint="Owner allowlist match" />
              <InfoCard title="Player Name" value={playerName} hint="Name used when entering the game" />
              <InfoCard title="Auth Server" value={AUTH_SERVER} hint="Current frontend auth target" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <PlaceholderPanel title="Users">
                User list will appear here after persistent storage is added. Planned fields: Discord ID, username, player name, first login, last login, and account status.
              </PlaceholderPanel>

              <PlaceholderPanel title="Tables">
                Multiplayer table controls will appear here later. Planned tools: open tables, active games, stuck table cleanup, and spectator/admin controls.
              </PlaceholderPanel>

              <PlaceholderPanel title="Moderation">
                Future controls: ban, unban, trust flags, report review, and action history. No moderation actions are wired yet.
              </PlaceholderPanel>

              <PlaceholderPanel title="System Status">
                Auth is connected for this browser session. Database, table server, and Discord bot status checks can be added in later phases.
              </PlaceholderPanel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
