import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavBar from "../components/NavBar";
import "../css/Playlist.css";
import { FaTrashAlt } from "react-icons/fa";

function Playlist() {
  const [tracks, setTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [editing, setEditing] = useState(false);

  const user = auth.currentUser;
  const playlistRef = user
    ? doc(db, "users", user.uid, "playlists", "default")
    : null;

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistRef) return;

      const snap = await getDoc(playlistRef);
      if (snap.exists()) {
        const data = snap.data();
        setTracks(data.tracks || []);
        setPlaylistName(data.name || "My Playlist");
      }
    };

    fetchPlaylist();
  }, []);

  const savePlaylistName = async () => {
    if (!playlistRef) return;

    await updateDoc(playlistRef, {
      name: playlistName,
    });

    setEditing(false);
  };

  const removeTrack = async (spotifyId) => {
    const updatedTracks = tracks.filter(
      (track) => track.spotifyId !== spotifyId
    );

    setTracks(updatedTracks); // instant UI update

    await updateDoc(playlistRef, {
      tracks: updatedTracks,
    });
  };

  return (
    <div className="playlist-page">
      <NavBar />
      <h1>My Playlist</h1>

      {tracks.length === 0 && <p>No tracks yet.</p>}

      <div className="track-grid">
        {tracks.map((track) => (
          <div key={track.spotifyId} className="track-card">
            <img src={track.albumUrl} className="track-image" />

            <div className="track-title">
              {track.title}
              {track.explicit && <span className="explicit-badge">E</span>}
            </div>

            <div className="track-artist">{track.artist}</div>

            <button
              className="remove-btn"
              onClick={() => removeTrack(track.spotifyId)}
              title="Remove from Playlist"
            >
              <FaTrashAlt />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Playlist;
