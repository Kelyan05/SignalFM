import { useState, useCallback } from "react";
import { PlayerContext } from "./PlayerContext.jsx";

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [queue, setQueue] = useState([]);

  const addToQueue = useCallback((track) => {
    setQueue((prev) => {
      if (prev.some((t) => t.spotifyId === track.spotifyId)) return prev;
      return [...prev, track];
    });
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const playTrack = useCallback(
    async (track) => {
      if (!deviceId) {
        console.warn("No device ID yet");
        return;
      }

      const token = localStorage.getItem("spotify_access_token");
      if (!token) {
        console.warn("No Spotify token");
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
    [deviceId]
  );

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        deviceId,
        setDeviceId,
        queue,
        playTrack,
        addToQueue,
        removeFromQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
