import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import NavBar from "../components/NavBar";
import "../css/Playlist.css";

function Playlist() {
  const [tracks, setTracks] = useState([]);

  const user = auth.currentUser;
  const playlistRef = user
    ? doc(db, "users", user.uid, "playlists", "default")
    : null;

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistRef) return;

      const snap = await getDoc(playlistRef);
      if (snap.exists()) {
        setTracks(snap.data().tracks || []);
      }
    };

    fetchPlaylist();
  }, []);

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
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Playlist;
