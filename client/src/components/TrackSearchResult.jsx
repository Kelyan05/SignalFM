import { useState } from "react";
import { auth, db } from "../config/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { FaPlusCircle } from "react-icons/fa";

function TrackSearchResult({ track, playlists }) {
  const [open, setOpen] = useState(false);

  const addToPlaylist = async (playlistId) => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");

    const playlistRef = doc(db, "playlists", playlistId);

    await updateDoc(playlistRef, {
      tracks: arrayUnion({
        spotifyId: track.spotifyId,
        title: track.title,
        artist: track.artist,
        albumUrl: track.albumUrl,
        explicit: track.explicit,
      }),
    });

    alert("Added to playlist!");
    setOpen(false);
  };

  return (
    <div className="track-card">
      <img
        src={track.albumUrl || "https://via.placeholder.com/200"}
        className="track-image"
      />

      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
      </div>

      <div className="playlist-dropdown">
        <button className="add-btn" onClick={() => setOpen(!open)}>
          <FaPlusCircle />
        </button>

        {open && (
          <div className="dropdown-menu">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="dropdown-item"
                onClick={() => addToPlaylist(playlist.id)}
              >
                {playlist.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackSearchResult;
