import { useState, useCallback } from "react";
import { PlayerContext } from "./PlayerContext.jsx";
import { auth } from "../config/firebase.js";

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [queue, setQueue] = useState([]);

  // ── Get a valid Spotify access token from localStorage ───────────────────
  const getValidToken = useCallback(async () => {
    // Try the key SpotifyAuth.jsx writes
    let token = localStorage.getItem("spotify_access_token");
    if (token) return token;

    // Fallback key used by Home.jsx
    token = localStorage.getItem("spotifyAccessToken");
    if (token) return token;

    // Attempt a refresh
    const refresh =
      localStorage.getItem("spotify_refresh_token") ||
      localStorage.getItem("spotifyRefreshToken");
    if (!refresh) return null;

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/spotify/token?refresh_token=${refresh}`
      );
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("spotify_access_token", data.access_token);
        return data.access_token;
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
    }
    return null;
  }, []);

  // ── Play a track via Spotify Web API ─────────────────────────────────────
  const playTrack = useCallback(
    async (track) => {
      if (!deviceId) {
        console.warn("No device ID yet — player not ready");
        return;
      }

      const token = await getValidToken();
      if (!token) {
        console.warn("No Spotify token available");
        return;
      }

      try {
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [`spotify:track:${track.spotifyId}`],
            }),
          }
        );
        setCurrentTrack(track);
      } catch (err) {
        console.error("playTrack failed:", err);
      }
    },
    [deviceId, getValidToken]
  );

  // ── Queue management ──────────────────────────────────────────────────────
  const addToQueue = useCallback((track) => {
    setQueue((prev) => {
      // Don't add duplicates
      if (prev.some((t) => t.spotifyId === track.spotifyId)) return prev;
      return [...prev, track];
    });
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        deviceId,
        setDeviceId,
        spotifyPlayer,
        setSpotifyPlayer,
        queue,
        playTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
