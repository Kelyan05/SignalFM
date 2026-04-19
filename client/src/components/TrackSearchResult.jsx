import { useContext, useRef, useEffect, useState } from "react";
import { PlayerContext }   from "../context/PlayerContext";
import { useTrackEvents }  from "../hooks/useTrackEvents";
import { useLikedTracks }  from "../context/LikedTracksProvider";
import { normalizeTrack }  from "../utils/normalizeTrack";

import { FaHeart, FaRegHeart, FaPlay, FaList, FaPlusCircle } from "react-icons/fa";
import "../css/TrackSearchResult.css";

/**
 * TrackSearchResult
 *
 * Reusable track card used on Dashboard, Recommendations, and Playlist pages.
 *
 * Props
 *   track           – raw or already-normalised track object
 *   playlists       – the user's playlists (for the add-to-playlist dropdown)
 *   onAddToPlaylist(playlistId, track) – writes the track to Firestore
 */
function TrackSearchResult({ track, playlists = [], onAddToPlaylist }) {
  const { setCurrentTrack, addToQueue } = useContext(PlayerContext);
  const { like, unlike, queue: queueEvent } = useTrackEvents();

  // Read like state from the global provider so it is consistent on every page.
  const { isLiked } = useLikedTracks();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Always normalise so every handler has guaranteed consistent field names.
  const safeTrack = normalizeTrack(track);
  const liked = isLiked(safeTrack.spotifyId);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePlay = () => setCurrentTrack(safeTrack);

  const handleQueue = () => {
    addToQueue(safeTrack);
    queueEvent(safeTrack.spotifyId);
  };

  // Pass the full safeTrack object — like() needs title/artist/albumUrl
  // to write metadata into users/{uid}/likedTracks in Firestore.
  const handleLike = () => {
    if (liked) {
      unlike(safeTrack);
    } else {
      like(safeTrack);
    }
  };

  // Close the playlist dropdown when the user clicks anywhere outside it.
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="track-card">
      <img
        src={safeTrack.albumUrl || "https://via.placeholder.com/200"}
        className="track-image"
        alt={safeTrack.title}
        onClick={handlePlay}
      />

      <div className="track-info">
        <div className="track-title">{safeTrack.title}</div>
        <div className="track-artist">{safeTrack.artist}</div>
      </div>

      <div className="track-actions">
        <button onClick={handlePlay} title="Play"><FaPlay /></button>

        <button onClick={handleQueue} title="Add to queue"><FaList /></button>

        <button onClick={handleLike} title={liked ? "Unlike" : "Like"}>
          {liked ? <FaHeart color="red" /> : <FaRegHeart />}
        </button>

        {/* Add-to-playlist dropdown */}
        <div className="playlist-dropdown-wrapper" ref={dropdownRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown((p) => !p); }}
            title="Add to playlist"
          >
            <FaPlusCircle />
          </button>

          {showDropdown && (
            <div className="playlist-dropdown">
              {playlists.length > 0 ? (
                playlists.map((p) => (
                  <div
                    key={p.id}
                    className="playlist-option"
                    onClick={() => {
                      onAddToPlaylist?.(p.id, safeTrack);
                      setShowDropdown(false);
                    }}
                  >
                    {p.name}
                  </div>
                ))
              ) : (
                <div className="playlist-option disabled">No playlists yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackSearchResult;