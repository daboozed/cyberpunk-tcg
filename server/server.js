import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([
  CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
]);
const isProduction = process.env.NODE_ENV === "production";

const sessions = new Map();

function getSupabaseServiceKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE
  );
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = getSupabaseServiceKey();
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

if (!supabase) {
  console.warn(
    "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

function parseCookies(req) {
  const header = req.headers.cookie || "";

  return header.split(";").reduce((cookies, item) => {
    const [rawName, ...rawValue] = item.trim().split("=");
    if (!rawName) return cookies;

    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.maxAge) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  if (options.path) parts.push(`Path=${options.path}`);

  res.append("Set-Cookie", parts.join("; "));
}

function getSameSiteCookiePolicy() {
  return isProduction ? "None" : "Lax";
}

function clearCookie(res, name) {
  setCookie(res, name, "", {
    httpOnly: true,
    sameSite: getSameSiteCookiePolicy(),
    secure: isProduction,
    maxAge: 0,
    path: "/",
  });
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getAvatarUrl(user) {
  if (!user?.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

async function persistDiscordUser(discordUser) {
  if (!supabase) {
    console.warn("Skipping user persistence because Supabase is not configured.");
    return;
  }

  const discordId = discordUser.id;

  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id, login_count")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (lookupError) {
    console.error("Failed to look up Discord user", lookupError.message);
  }

  const payload = {
    discord_id: discordId,
    username: discordUser.username,
    global_name: discordUser.global_name,
    avatar: getAvatarUrl(discordUser),
    display_name: discordUser.global_name || discordUser.username,
    last_login: new Date().toISOString(),
  };

  if (existingUser) {
    payload.login_count = (existingUser.login_count || 0) + 1;
  }

  const { error } = await supabase
    .from("users")
    .upsert(payload, {
      onConflict: "discord_id",
    });

  if (error) {
    console.error("Failed to persist Discord user", error.message);
  }
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  return cookies.cp_session ? sessions.get(cookies.cp_session) : null;
}

app.get("/", (req, res) => {
  res.send("Discord Login Server Running");
});

app.get("/auth/me", (req, res) => {
  const user = getSessionUser(req);

  if (!user) {
    return res.status(401).json({ user: null });
  }

  res.json({ user });
});

app.get("/admin/users", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error:
          "Supabase is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Render.",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("last_login", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ users: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/logout", (req, res) => {
  const cookies = parseCookies(req);

  if (cookies.cp_session) {
    sessions.delete(cookies.cp_session);
  }

  clearCookie(res, "cp_session");
  res.json({ ok: true });
});

app.get("/auth/discord", (req, res) => {
  try {
    const state = crypto.randomBytes(24).toString("hex");
    const redirectUri = requireEnv("DISCORD_REDIRECT_URI");

    setCookie(res, "discord_oauth_state", state, {
      httpOnly: true,
      sameSite: getSameSiteCookiePolicy(),
      secure: isProduction,
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    const params = new URLSearchParams({
      client_id: requireEnv("DISCORD_CLIENT_ID"),
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "identify email",
      state,
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

app.get("/auth/discord/callback", async (req, res) => {
  const { code, state } = req.query;
  const cookies = parseCookies(req);

  if (!code) {
    return res.status(400).send("Discord Login Failed: missing authorization code.");
  }

  if (!state || state !== cookies.discord_oauth_state) {
    return res.status(400).send("Discord Login Failed: invalid OAuth state.");
  }

  try {
    const token = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: requireEnv("DISCORD_CLIENT_ID"),
        client_secret: requireEnv("DISCORD_CLIENT_SECRET"),
        grant_type: "authorization_code",
        code,
        redirect_uri: requireEnv("DISCORD_REDIRECT_URI"),
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const user = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token.data.access_token}`,
      },
    });

    const discordUser = user.data;

    await persistDiscordUser(discordUser);

    const safeUser = {
      id: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      avatarUrl: getAvatarUrl(discordUser),
      email: discordUser.email || null,
    };

    const sessionId = crypto.randomBytes(32).toString("hex");
    sessions.set(sessionId, safeUser);

    clearCookie(res, "discord_oauth_state");
    setCookie(res, "cp_session", sessionId, {
      httpOnly: true,
      sameSite: getSameSiteCookiePolicy(),
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.send(`
      <html>
        <body style="background:#0b1020;color:white;font-family:Arial;text-align:center;padding-top:80px;">
          <h2>Welcome ${safeUser.globalName || safeUser.username}</h2>
          <p>You can close this window.</p>

          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "DISCORD_LOGIN_SUCCESS" }, "*");
              window.close();
            } else {
              window.location.href = "${CLIENT_URL}";
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Discord Login Failed", err.response?.data || err.message);
    res.status(500).send("Discord Login Failed");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
