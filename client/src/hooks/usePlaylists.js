import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "playlists"),
        where("ownerId", "==", user.uid)
      );

      const snap = await getDocs(q);
      setPlaylists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetch();
  }, []);

  return { playlists, setPlaylists };
};