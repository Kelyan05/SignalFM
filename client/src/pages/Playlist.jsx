import { useState } from "react";
import NavBar from "../components/NavBar";
import PlaylistCard from "../components/PlaylistCard";
import TrackSearchResult from "../components/TrackSearchResult";
import { usePlaylists } from "../hooks/usePlaylists";
import { useLikedTracks } from "../context/LikedTracksProvider";

import { FaPlus } from "react-icons/fa";
import "../css/Playlist.css";

function Playlist() {
  const {
    playlists,
    loading,
    createPlaylist,
    addToPlaylist,
    removeTrack,
    renamePlaylist,
    deletePlaylist,
  } = usePlaylists();

  // ✅ GLOBAL LIKED TRACKS (FROM CONTEXT)
  const { likedTracks } = useLikedTracks();

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistName, setPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  // ── Create playlist ──
  const handleCreate = async () => {
    if (!playlistName.trim()) return;
    setCreating(true);

    await createPlaylist(playlistName.trim());

    setPlaylistName("");
    setCreating(false);
  };

  // ── Share playlist ──
  const sharePlaylist = async (playlistId) => {
    const link = `${window.location.origin}/shared/${playlistId}`;
    await navigator.clipboard.writeText(link);
    setCopied(playlistId);
    setTimeout(() => setCopied(null), 2500);
  };

  // ── Decide which tracks to show ──
  const viewTracks =
    selectedPlaylist === "liked" ? likedTracks : selectedPlaylist?.tracks ?? [];

  return (
    <div className="playlist-page">
      <NavBar />

      {/* HEADER */}
      <div className="playlist-header-row">
        <h1>My Playlists</h1>
        <span className="playlist-count">
          {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
        </span>
      </div>

      {/* CREATE PLAYLIST */}
      <div className="playlist-create">
        <input
          placeholder="New playlist name..."
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !playlistName.trim()}
        >
          <FaPlus /> {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {copied && <div className="toast">✓ Link copied!</div>}

      {loading ? (
        <p className="playlist-loading">Loading...</p>
      ) : (
        <>
          {/* PLAYLIST LIST */}
          <div className="playlist-cards">
            {/* Liked Songs Card */}
            <div
              className={`playlist-card liked ${
                selectedPlaylist === "liked" ? "active" : ""
              }`}
              onClick={() => setSelectedPlaylist("liked")}
            >
              ❤️ Liked Songs ({likedTracks.length})
            </div>

            {/* User Playlists */}
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

          {/* TRACK VIEW */}
          {selectedPlaylist && (
            <div className="playlist-tracks-view">
              <h2>
                {selectedPlaylist === "liked"
                  ? "❤️ Liked Songs"
                  : selectedPlaylist.name}
              </h2>

              {viewTracks.length === 0 ? (
                <p>No tracks here yet.</p>
              ) : (
                <div className="track-grid">
                  {viewTracks.map((track) => (
                    <TrackSearchResult
                      key={track.spotifyId}
                      track={track}
                      playlists={playlists}
                      onAddToPlaylist={addToPlaylist}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Playlist;
