import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

// LOGIN
router.get("/login", (req, res) => {

  const scope =
    "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state";

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope,
      redirect_uri: redirectUri,
      show_dialog: true
    });

  res.redirect(authUrl);
});


// CALLBACK
router.get("/callback", async (req, res) => {

  const code = req.query.code;

  try {

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(clientId + ":" + clientSecret).toString("base64")
        }
      }
    );

    const { access_token, refresh_token } = response.data;

    res.redirect(
      `http://127.0.0.1:5173/spotify-auth?access_token=${access_token}&refresh_token=${refresh_token}`
    );

  } catch (error) {
    console.error("Spotify callback error:", error.response?.data || error.message);
    res.status(500).send("Spotify authentication failed");
  }

});

export default router;