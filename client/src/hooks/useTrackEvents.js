import { useCallback } from "react";
import { auth } from "../config/firebase";

export function useTrackEvents() {
  const sendEvent = useCallback(async (trackId, action, meta = {}) => {
    const user = auth.currentUser;
    if (!user || !trackId || !action) return;

    try {
      const token = await user.getIdToken();

      await fetch(`${import.meta.env.VITE_API_URL}/api/track/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackId,
          action, // play | skip | like | unlike | queue
          timestamp: Date.now(),
          ...meta,
        }),
      });
    } catch (err) {
      console.error("Track event failed:", err);
    }
  }, []);

  return {
    play: (trackId, meta) => sendEvent(trackId, "play", meta),
    skip: (trackId, meta) => sendEvent(trackId, "skip", meta),
    like: (trackId, meta) => sendEvent(trackId, "like", meta),
    unlike: (trackId, meta) => sendEvent(trackId, "unlike", meta),
    queue: (trackId, meta) => sendEvent(trackId, "queue", meta),
  };
}