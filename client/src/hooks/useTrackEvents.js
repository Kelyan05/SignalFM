import { useCallback } from "react";
import { auth, db } from "../config/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

const API = import.meta.env.VITE_API_URL;

/**
 * useTrackEvents
 *
 * Central hook for all track interactions: play, skip, like, unlike, queue.
 *
 * LIKE / UNLIKE do two things:
 *   1. Write to / delete from users/{uid}/likedTracks in Firestore.
 *      This is what LikedTracksProvider reads, so the heart icon updates
 *      globally across every page the moment it is called.
 *   2. POST to /api/track/event so the backend engagement score updates
 *      and the recommendation cache is busted.
 *
 * All other events (play, skip, queue) are fire-and-forget POSTs only.
 *
 * NOTE: like() and unlike() accept the full track object (not just an ID)
 * because we need to store title/artist/albumUrl in the likedTracks doc.
 */
export function useTrackEvents() {

  // ── Backend-only event ──────────────────────────────────────────────────
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

  // ── Like ─────────────────────────────────────────────────────────────────
  const like = useCallback(async (track) => {
    const user = auth.currentUser;
    if (!user || !track?.spotifyId) return;

    try {
      // Write the track into the likedTracks subcollection.
      // The document key is the spotifyId so it's idempotent.
      await setDoc(
        doc(db, "users", user.uid, "likedTracks", track.spotifyId),
        {
          spotifyId: track.spotifyId,
          title:    track.title    ?? "",
          artist:   track.artist   ?? "",
          albumUrl: track.albumUrl ?? track.image ?? "",
          likedAt:  new Date(),
        }
      );

      // Also update the engagement score on the backend.
      await sendEvent(track.spotifyId, "like");

      // Broadcast so LikedTracksProvider re-fetches and every page updates.
      window.dispatchEvent(new Event("likedTracksUpdate"));
    } catch (err) {
      console.error("[useTrackEvents] like failed:", err.message);
    }
  }, [sendEvent]);

  // ── Unlike ───────────────────────────────────────────────────────────────
  const unlike = useCallback(async (track) => {
    const user = auth.currentUser;
    if (!user || !track?.spotifyId) return;

    try {
      // Remove the doc so the heart goes hollow everywhere instantly.
      await deleteDoc(
        doc(db, "users", user.uid, "likedTracks", track.spotifyId)
      );

      await sendEvent(track.spotifyId, "unlike");

      window.dispatchEvent(new Event("likedTracksUpdate"));
    } catch (err) {
      console.error("[useTrackEvents] unlike failed:", err.message);
    }
  }, [sendEvent]);

  return {
    play:   (trackId) => sendEvent(trackId, "play"),
    skip:   (trackId) => sendEvent(trackId, "skip"),
    queue:  (trackId) => sendEvent(trackId, "queue"),
    like,   // takes full track object
    unlike, // takes full track object
  };
}