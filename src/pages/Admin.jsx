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

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
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

function UsersPanel({ users, loading, error }) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/45 p-4 lg:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">
            Users
          </div>
          <div className="mt-1 text-xs text-white/40">
            Persisted Discord logins from Supabase
          </div>
        </div>
        <div className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          {users.length} total
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/45">
          Loading users...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-yellow-500/25 bg-yellow-500/10 p-4 text-sm text-yellow-100/70">
          No persisted users yet. Have a player log in with Discord, then refresh this page.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="sticky top-0 bg-black/90 text-white/45">
                <tr>
                  <th className="px-3 py-2 font-semibold">Player</th>
                  <th className="px-3 py-2 font-semibold">Discord ID</th>
                  <th className="px-3 py-2 font-semibold">Logins</th>
                  <th className="px-3 py-2 font-semibold">Rating</th>
                  <th className="px-3 py-2 font-semibold">Last Login</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user.discord_id} className="bg-black/25 text-white/65">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-cyan-100">
                        {user.display_name || user.global_name || user.username || "Unknown"}
                      </div>
                      <div className="text-white/35">@{user.username || "unknown"}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-white/45">{user.discord_id}</td>
                    <td className="px-3 py-3">{user.login_count || 0}</td>
                    <td className="px-3 py-3">{user.rating ?? 1000}</td>
                    <td className="px-3 py-3">{formatDate(user.last_login)}</td>
                    <td className="px-3 py-3">
                      {user.is_banned ? (
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-200">
                          Banned
                        </span>
                      ) : (
                        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-green-200">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [authLoading, setAuthLoading] = useState(true);
  const [discordUser, setDiscordUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

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

  useEffect(() => {
    if (!isOwner) return;

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError("");

      try {
        const res = await fetch(`${AUTH_SERVER}/admin/users`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Could not load users (${res.status})`);
        }

        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setUsersError(err.message || "Could not load users.");
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [isOwner]);

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
              Control center for Discord auth, persisted users, account status, and future multiplayer moderation tools.
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
              <UsersPanel users={users} loading={usersLoading} error={usersError} />

              <PlaceholderPanel title="Tables">
                Multiplayer table controls will appear here later. Planned tools: open tables, active games, stuck table cleanup, and spectator/admin controls.
              </PlaceholderPanel>

              <PlaceholderPanel title="Moderation">
                Future controls: ban, unban, trust flags, report review, and action history. No moderation actions are wired yet.
              </PlaceholderPanel>

              <PlaceholderPanel title="System Status">
                Auth is connected for this browser session. Supabase user persistence is wired through the backend.
              </PlaceholderPanel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
