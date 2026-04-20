import { useCallback } from "react";
import { auth, db } from "../config/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { apiFetch } from "../utils/apiClient";

const API = import.meta.env.VITE_API_URL;

export function useTrackEvents() {


  const sendEvent = useCallback(async (trackId, action) => {
    if (!trackId || !action) return;
    try {
      await apiFetch(`${API}/api/track/event`, {
        method: "POST",
        body: JSON.stringify({ trackId, action }),
      });
    } catch (err) {

      console.error(`[useTrackEvents] ${action} failed:`, err.message);
    }
  }, []);


  const like = useCallback(async (track) => {
    const user = auth.currentUser;
    if (!user || !track?.spotifyId) return;

    try {

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


      await sendEvent(track.spotifyId, "like");


      window.dispatchEvent(new Event("likedTracksUpdate"));
    } catch (err) {
      console.error("[useTrackEvents] like failed:", err.message);
    }
  }, [sendEvent]);


  const unlike = useCallback(async (track) => {
    const user = auth.currentUser;
    if (!user || !track?.spotifyId) return;

    try {
 
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
    like,  
    unlike,
  };
}