import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import NavBar from "../components/NavBar";
import PlaylistCard from "../components/PlaylistCard";
import { FaPlus, FaMusic } from "react-icons/fa";
import "../css/Playlist.css";
import TrackSearchResult from "../components/TrackSearchResult";

function Playlist() {
  const [playlists, setPlaylists] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [likedTracks, setLikedTracks] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const user = auth.currentUser;

  //liked playlist is separate from user playlists collection, so fetch it on page load to pass to TrackSearchResult for the heart icon
  useEffect(() => {
    const fetchLiked = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDocs(
        collection(db, "users", user.uid, "likedTracks")
      );

      setLikedTracks(snap.docs.map((doc) => doc.data()));
    };

    fetchLiked();
  }, []);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "playlists"),
          where("ownerId", "==", user.uid)
        );
        const snap = await getDocs(q);
        setPlaylists(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load playlists:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [user]);

  const createPlaylist = async () => {
    if (!playlistName.trim() || creating) return;
    setCreating(true);
    const playlistId = crypto.randomUUID();
    const newPlaylist = {
      ownerId: user.uid,
      name: playlistName.trim(),
      tracks: [],
      public: true,
      createdAt: new Date(),
    };
    try {
      await setDoc(doc(db, "playlists", playlistId), newPlaylist);
      setPlaylists((prev) => [...prev, { id: playlistId, ...newPlaylist }]);
      setPlaylistName("");
    } catch (err) {
      console.error("Failed to create playlist:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") createPlaylist();
  };

  const renamePlaylist = async (playlistId, name) => {
    await updateDoc(doc(db, "playlists", playlistId), { name });
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, name } : p))
    );
  };

  const removeTrack = async (playlistId, spotifyId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    const updatedTracks = playlist.tracks.filter(
      (t) => t.spotifyId !== spotifyId
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

  const sharePlaylist = async (playlistId) => {
    const link = `${window.location.origin}/shared/${playlistId}`;
    await navigator.clipboard.writeText(link);
    setCopied(playlistId);
    setTimeout(() => setCopied(null), 2500);
  };

  const deletePlaylist = async (playlistId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this playlist? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "playlists", playlistId));
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  };

  return (
    <div className="playlist-page">
      <NavBar />

      <div className="playlist-header-row">
        <h1>My Playlists</h1>
        <span className="playlist-count">
          {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
        </span>
      </div>

      <div className="playlist-create">
        <input
          placeholder="New playlist name..."
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={60}
        />
        <button
          onClick={createPlaylist}
          disabled={creating || !playlistName.trim()}
        >
          <FaPlus />
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {copied && <div className="toast">✓ Link copied to clipboard!</div>}

      {loading ? (
        <p className="playlist-loading">Loading your playlists...</p>
      ) : (
        <>
          {/* 🔥 PLAYLIST CARDS */}
          <div className="playlist-cards">
            {/* ❤️ Liked Songs */}
            <div
              className={`playlist-card liked ${
                selectedPlaylist === "liked" ? "active" : ""
              }`}
              onClick={() => setSelectedPlaylist("liked")}
            >
              <div className="playlist-card-title">❤️ Liked Songs</div>
              <div className="playlist-card-count">
                {likedTracks.length} tracks
              </div>
            </div>

            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onRename={renamePlaylist}
                onRemoveTrack={removeTrack}
                onShare={sharePlaylist}
                onDelete={deletePlaylist}
                onClick={() => setSelectedPlaylist(playlist)}
              />
            ))}
          </div>

          {/* 🔥 TRACK VIEW (SEPARATE) */}
          {selectedPlaylist && (
            <div className="playlist-tracks-view">
              <h2>
                {selectedPlaylist === "liked"
                  ? "❤️ Liked Songs"
                  : selectedPlaylist.name}
              </h2>

              <div className="track-grid">
                {(selectedPlaylist === "liked"
                  ? likedTracks
                  : selectedPlaylist.tracks || []
                ).map((track) => (
                  <TrackSearchResult
                    key={track.spotifyId}
                    track={track}
                    playlists={playlists}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Playlist;
