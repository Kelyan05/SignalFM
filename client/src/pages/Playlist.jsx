import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

import NavBar from "../components/NavBar";
import PlaylistCard from "../components/PlaylistCard";
import { FaPlus } from "react-icons/fa";

function Playlist() {
  const [playlists, setPlaylists] = useState([]);
  const [playlistName, setPlaylistName] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user) return;

      const q = query(
        collection(db, "playlists"),
        where("ownerId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPlaylists(list);
    };

    fetchPlaylists();
  }, [user]);

  const createPlaylist = async () => {
    if (!playlistName.trim()) return;

    const playlistId = crypto.randomUUID();

    const newPlaylist = {
      ownerId: user.uid,
      name: playlistName,
      tracks: [],
      public: true,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "playlists", playlistId), newPlaylist);

    setPlaylists((prev) => [...prev, { id: playlistId, ...newPlaylist }]);

    setPlaylistName("");
  };

  const renamePlaylist = async (playlistId, name) => {
    await updateDoc(doc(db, "playlists", playlistId), {
      name,
    });

    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, name } : p))
    );
  };

  const removeTrack = async (playlistId, spotifyId) => {
    const playlist = playlists.find((p) => p.id === playlistId);

    const updatedTracks = playlist.tracks.filter(
      (track) => track.spotifyId !== spotifyId
    );

    await updateDoc(doc(db, "playlists", playlistId), {
      tracks: updatedTracks,
    });

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, tracks: updatedTracks } : p
      )
    );
  };

  const sharePlaylist = (playlistId) => {
    const link = `${window.location.origin}/shared/${playlistId}`;

    navigator.clipboard.writeText(link);

    alert("Playlist link copied!");
  };

  return (
    <div className="playlist-page">
      <NavBar />

      <h1>My Playlists</h1>

      <div className="playlist-create">
        <input
          placeholder="New playlist name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />

        <button onClick={createPlaylist}>
          <FaPlus /> Create Playlist
        </button>
      </div>

      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          onRename={renamePlaylist}
          onRemoveTrack={removeTrack}
          onShare={sharePlaylist}
        />
      ))}
    </div>
  );
}

export default Playlist;
