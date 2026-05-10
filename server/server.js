import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";

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

function clearCookie(res, name) {
  setCookie(res, name, "", {
    httpOnly: true,
    sameSite: "Lax",
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

app.get("/", (req, res) => {
  res.send("Discord Login Server Running");
});

app.get("/auth/me", (req, res) => {
  const cookies = parseCookies(req);
  const user = cookies.cp_session ? sessions.get(cookies.cp_session) : null;

  if (!user) {
    return res.status(401).json({ user: null });
  }

  res.json({ user });
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
