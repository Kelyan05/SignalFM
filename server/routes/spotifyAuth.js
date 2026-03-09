import express from "express";
import axios from "axios";

const router = express.Router();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

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
    });

  res.redirect(authUrl);
});

export default router;