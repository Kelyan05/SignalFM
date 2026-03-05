import axios from "axios";
import { Buffer } from "buffer";

let cachedToken = null;
let tokenExpiry = null;

export const getSpotifyToken = async () => {
  try {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const authString = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authString}`
        }
      }
    );

    cachedToken = response.data.access_token;

    // Refresh 60s before expiry
    tokenExpiry =
      Date.now() + (response.data.expires_in - 60) * 1000;

    console.log("Spotify token refreshed");

    return cachedToken;
  } catch (error) {
    console.error("Spotify token error:", error.response?.data || error.message);
    throw new Error("Failed to get Spotify token");
  }
};