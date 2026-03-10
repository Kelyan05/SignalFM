import axios from "axios";
import dotenv from "dotenv";
import open from "open";
import express from "express";

dotenv.config();

const app = express();

const PORT = 3001;

// Step 1: Build Spotify authorization URL
const scopes = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state"
].join(" ");

const authURL = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;

console.log("Opening Spotify authorization URL...");
await open(authURL);

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send("No code received.");

  try {
    // Step 2: Exchange code for access + refresh token
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", process.env.SPOTIFY_REDIRECT_URI);

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params.toString(),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { refresh_token } = response.data;

    console.log("\n✅ Your Spotify refresh token is:\n", refresh_token);
    console.log("\nCopy this into your .env as SPOTIFY_REFRESH_TOKEN");

    res.send(
      "Refresh token retrieved! Check your terminal and copy it to your .env."
    );

    process.exit(0); // stop the server after success
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Failed to get refresh token.");
  }
});

app.listen(PORT, () => {
  console.log(`Listening on http://127.0.0.1:${PORT}/callback`);
});