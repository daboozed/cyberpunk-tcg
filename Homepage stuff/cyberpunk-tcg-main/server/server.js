import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("Discord Login Server Running");
});

app.get("/auth/discord", (req, res) => {
  const url =
    `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}` +
    `&scope=identify email`;

  res.redirect(url);
});

app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const token = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const user = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${token.data.access_token}`
        }
      }
    );

    res.send(`
      <html>
        <body style="background:#0b1020;color:white;font-family:Arial;text-align:center;padding-top:80px;">
          <h2>Welcome ${user.data.username}</h2>

          <script>
            if (window.opener) {
              window.opener.location.reload();
              window.close();
            }
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    res.send("Discord Login Failed");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});