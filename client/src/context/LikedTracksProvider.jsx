import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { auth, db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

const LikedTracksContext = createContext();

export function LikedTracksProvider({ children }) {
  const [likedTracks, setLikedTracks] = useState([]);

  const fetchLikedTracks = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDocs(
      collection(db, "users", user.uid, "likedTracks")
    );

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setLikedTracks(data);
  }, []);

  useEffect(() => {
    fetchLikedTracks();
  }, [fetchLikedTracks]);

  const isLiked = useCallback(
    (spotifyId) => likedTracks.some((t) => t.spotifyId === spotifyId),
    [likedTracks]
  );

  return (
    <LikedTracksContext.Provider
      value={{
        likedTracks,
        fetchLikedTracks,
        isLiked,
      }}
    >
      {children}
    </LikedTracksContext.Provider>
  );
}

export const useLikedTracks = () => useContext(LikedTracksContext);
