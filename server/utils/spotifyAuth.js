import axios from "axios";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

const tokenCache = new Map();

// Exchange code
export const exchangeCodeForToken = async (code) => {
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
            "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Spotify exchange error:", err.response?.data || err.message);
    throw new Error("Token exchange failed");
  }
};

// Refresh token (PER USER + BUFFER)
export const refreshAccessToken = async (refreshToken) => {
  try {
    const cached = tokenCache.get(refreshToken);

    if (cached && Date.now() < cached.expiry) {
      return cached.token;
    }

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
      }
    );

    const accessToken = response.data.access_token;

    const expiry =
      Date.now() + (response.data.expires_in - 60) * 1000;

    tokenCache.set(refreshToken, {
      token: accessToken,
      expiry
    });

    return accessToken;
  } catch (err) {
    console.error("Spotify refresh error:", err.response?.data || err.message);
    throw new Error("Token refresh failed");
  }
};