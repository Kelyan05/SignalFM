import axios from "axios";

let cachedToken = null;
let tokenExpiry = 0;
let refreshPromise = null;

/**
 * Get a valid Spotify access token.
 * Refreshes token if expired, caches it in memory & localStorage.
 */
export const getValidAccessToken = async () => {
  const storedToken = localStorage.getItem("spotify_access_token");
  const expiry = localStorage.getItem("spotify_token_expiry");

  // Use cached token if valid
  if (storedToken && expiry && Date.now() < Number(expiry)) {
    return storedToken;
  }

  // Prevent multiple refresh requests
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      if (!refreshToken) throw new Error("No refresh token available");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/spotify/token?refresh_token=${refreshToken}`
      );

      if (!res.data?.access_token) throw new Error("No access token returned");

      const expiresInMs = 55 * 60 * 1000; // slightly less than 1 hour
      const token = res.data.access_token;

      // Cache in memory and localStorage
      cachedToken = token;
      tokenExpiry = Date.now() + expiresInMs;

      localStorage.setItem("spotify_access_token", token);
      localStorage.setItem("spotify_token_expiry", tokenExpiry);

      return token;
    } catch (err) {
      console.error("Spotify token refresh failed:", err);
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_token_expiry");
      window.location.href = "/login"; // force re-login
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Force a token refresh (optional)
 */
export const refreshAccessToken = async () => {
  cachedToken = null;
  tokenExpiry = 0;
  return getAccessToken();
};