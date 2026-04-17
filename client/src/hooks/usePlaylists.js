import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaylists = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setPlaylists([]);
        return;
      }

      setLoading(true);

      const q = query(
        collection(db, "playlists"),
        where("ownerId", "==", user.uid)
      );

      const snap = await getDocs(q);

      setPlaylists(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    } catch (err) {
      console.error("Playlist fetch error:", err);
      setError("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  return {
    playlists,
    setPlaylists,    
    loading,
    error,
    refresh: fetchPlaylists,
  };
};