import React from "react";
import "../css/TrackSearchResult.css";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function TrackSearchResult({ track }) {
  const addToPlaylist = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in");

    const playlistRef = doc(db, "users", user.uid, "playlists", "default");
    const playlistSnap = await getDoc(playlistRef);

    let tracks = [];

    if (playlistSnap.exists()) {
      tracks = playlistSnap.data().tracks || [];
    }

    // 🔥 Prevent duplicates (explicit / clean share same spotifyId)
    if (tracks.some((t) => t.spotifyId === track.spotifyId)) {
      return alert("Track already in playlist");
    }

    await setDoc(
      playlistRef,
      {
        name: "Default Playlist",
        tracks: [
          ...tracks,
          {
            spotifyId: track.spotifyId,
            title: track.title,
            artist: track.artist || "Unknown Artist",
            albumUrl: track.albumUrl || "",
            explicit: track.explicit ?? false,
            addedAt: new Date(),
          },
        ],
      },
      { merge: true }
    );
  };

  return (
    <div className="track-card">
      <img src={track.albumUrl} alt={track.title} className="track-image" />

      <div className="track-info">
        <div className="track-title">
          {track.title}
          {track.explicit && <span className="explicit-badge">E</span>}
        </div>
        <div className="track-artist">{track.artist}</div>
      </div>

      <button className="add-btn" onClick={addToPlaylist}>
        Add to Playlist
      </button>
    </div>
  );
}

export default TrackSearchResult;
