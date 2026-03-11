import { exchangeCodeForToken, refreshAccessToken } from "../utils/spotifyAuth.js";

// Redirect user to Spotify login
export const spotifyLogin = (req, res) => {
  const scope =
    "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state";
  
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      show_dialog: true,
    });

  res.redirect(authUrl);
};

// Callback endpoint from Spotify after login
export const spotifyCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Authorization code missing");

  try {
    const { access_token, refresh_token } = await exchangeCodeForToken(code);

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.SPOTIFY_REDIRECT_URI}/spotify-auth?access_token=${access_token}&refresh_token=${refresh_token}`
    );
  } catch (err) {
    console.error("Spotify callback error:", err.response?.data || err.message);
    res.status(500).send("Spotify authentication failed");
  }
};

// Refresh access token endpoint
export const spotifyToken = async (req, res) => {
  const { refresh_token } = req.query;
  if (!refresh_token) return res.status(400).json({ error: "Refresh token required" });

  try {
    const accessToken = await refreshAccessToken(refresh_token);
    res.json({ access_token: accessToken });
  } catch (err) {
    console.error("Spotify token refresh error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to refresh token" });
  }
};