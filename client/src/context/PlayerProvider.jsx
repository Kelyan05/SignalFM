import { useState, useCallback, useRef } from "react";
import { PlayerContext } from "./PlayerContext.jsx";

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [queue, setQueue] = useState([]);

  // ── 30-second preview playback (no-Premium fallback) ──
  // Full playback needs the Web Playback SDK, which requires Spotify Premium.
  // For everyone else we play Spotify's 30s MP3 sample through a single
  // shared <audio> element, so starting one preview always stops the last.
  const previewAudioRef = useRef(null);
  const [previewTrackId, setPreviewTrackId] = useState(null);

  const stopPreview = useCallback(() => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setPreviewTrackId(null);
  }, []);

  const playPreview = useCallback((track) => {
    if (!track?.preview_url) return;

    // Clicking the track that's already previewing toggles it off.
    if (previewAudioRef.current && previewTrackId === track.spotifyId) {
      stopPreview();
      return;
    }

    previewAudioRef.current?.pause();
    const audio = new Audio(track.preview_url);
    audio.onended = () => setPreviewTrackId(null);
    audio.play().catch((err) => console.warn("Preview playback failed:", err));
    previewAudioRef.current = audio;
    setPreviewTrackId(track.spotifyId);
  }, [previewTrackId, stopPreview]);

  // ── Add to queue ──
  const addToQueue = useCallback((track) => {
    if (!track?.spotifyId) {
      console.warn("Invalid track (missing spotifyId):", track);
      return;
    }

    setQueue((prev) => {
      if (prev.some((t) => t.spotifyId === track.spotifyId)) return prev;
      return [...prev, track];
    });
  }, []);

  // ── Remove from queue ──
  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Play a track via Spotify API ──
  const playTrack = useCallback(
    async (track) => {
      if (!track?.spotifyId) {
        console.error("playTrack: invalid track", track);
        return;
      }

      const token = localStorage.getItem("spotify_access_token");

      if (!token || !deviceId) {
        console.warn("Missing token or deviceId");
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

  // ── Play next track in queue ──
  const playNext = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;

      const [next, ...rest] = prev;

      if (next?.spotifyId) {
        playTrack(next);
      } else {
        console.warn("Skipping invalid queue item:", next);
      }

      return rest;
    });
  }, [playTrack]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        deviceId,
        setDeviceId,
        queue,
        addToQueue,
        removeFromQueue,
        playTrack,
        playNext,
        playPreview,
        stopPreview,
        previewTrackId,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
