import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const LikedTracksContext = createContext({
  likedTracks: [],
  fetchLikedTracks: async () => {},
  isLiked: () => false,
});

export function LikedTracksProvider({ children }) {
  const [likedTracks, setLikedTracks] = useState([]);

  // Fetch from Firestore — always safe to call, guards against null user.
  const fetchLikedTracks = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const snap = await getDocs(
        collection(db, "users", user.uid, "likedTracks")
      );
      setLikedTracks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("[LikedTracksProvider] fetch failed:", err);
    }
  }, []);

  // Wait for Firebase to resolve auth before fetching.
  // onAuthStateChanged fires immediately with the current user (or null),
  // so this correctly handles both fresh logins and page refreshes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchLikedTracks();
      } else {
        setLikedTracks([]); // clear on logout
      }
    });
    return unsubscribe;
  }, [fetchLikedTracks]);

  // Re-fetch whenever another part of the app fires this event
  // (e.g. after a like/unlike in useTrackEvents).
  useEffect(() => {
    window.addEventListener("likedTracksUpdate", fetchLikedTracks);
    return () => window.removeEventListener("likedTracksUpdate", fetchLikedTracks);
  }, [fetchLikedTracks]);

  const isLiked = useCallback(
    (spotifyId) => likedTracks.some((t) => t.spotifyId === spotifyId),
    [likedTracks]
  );

  return (
    <LikedTracksContext.Provider value={{ likedTracks, fetchLikedTracks, isLiked }}>
      {children}
    </LikedTracksContext.Provider>
  );
}

// Safe hook — throws a clear error if used outside the provider tree
// instead of a cryptic "cannot read property of undefined" crash.
export function useLikedTracks() {
  const ctx = useContext(LikedTracksContext);
  if (!ctx) throw new Error("useLikedTracks must be used inside LikedTracksProvider");
  return ctx;
}