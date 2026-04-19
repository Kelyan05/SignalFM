import { useCallback } from "react";
import { auth } from "../config/firebase";

const API = import.meta.env.VITE_API_URL;

/**
 * useTrackEvents
 * Sends play / skip / like / unlike / queue events to the backend.
 * Every function is fire-and-forget — errors are logged but never
 * propagate to the UI so playback is never interrupted.
 */
export function useTrackEvents() {
  const sendEvent = useCallback(async (trackId, action) => {
    const user = auth.currentUser;
    if (!user || !trackId || !action) return;

    try {
      const token = await user.getIdToken();

      await fetch(`${API}/api/track/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackId, action }),
      });
    } catch (err) {
      console.error(`[useTrackEvents] ${action} failed:`, err.message);
    }
  }, []);

  return {
    play:   (trackId) => sendEvent(trackId, "play"),
    skip:   (trackId) => sendEvent(trackId, "skip"),
    like:   (trackId) => sendEvent(trackId, "like"),
    unlike: (trackId) => sendEvent(trackId, "unlike"),
    queue:  (trackId) => sendEvent(trackId, "queue"),
  };
}