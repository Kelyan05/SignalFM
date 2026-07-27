import { useContext, useRef, useEffect, useState } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { useTrackEvents } from "../hooks/useTrackEvents";
import { useLikedTracks } from "../hooks/useLikedTracks";
import { normalizeTrack } from "../utils/normalizeTrack";

import {
  FaHeart,
  FaRegHeart,
  FaPlay,
  FaPause,
  FaList,
  FaPlusCircle,
} from "react-icons/fa";
import "../css/TrackSearchResult.css";

function TrackSearchResult({ track, playlists = [], onAddToPlaylist }) {
  const {
    setCurrentTrack,
    addToQueue,
    deviceId,
    playPreview,
    stopPreview,
    previewTrackId,
  } = useContext(PlayerContext);
  const { like, unlike, queue: queueEvent, play: playEvent } = useTrackEvents();

  // Read like state from the global provider so it is consistent on every page.
  const { isLiked } = useLikedTracks();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Always normalise so every handler has guaranteed consistent field names.
  const safeTrack = normalizeTrack(track);
  const liked = isLiked(safeTrack.spotifyId);

  const isPreviewing = previewTrackId === safeTrack.spotifyId;

  // Tiered playback so the app works without Spotify Premium:
  //   1. SDK device ready (Premium user, Spotify connected) → full playback.
  //   2. No device but Spotify provides a 30s sample → play the preview.
  //   3. Neither → open the track on open.spotify.com (works for everyone).
  // The fallback paths record the play event themselves so the
  // recommendation engine still learns from non-Premium listening.
  const handlePlay = () => {
    if (deviceId) {
      stopPreview();
      setCurrentTrack(safeTrack);
      return;
    }
    playEvent(safeTrack.spotifyId);
    if (safeTrack.preview_url) {
      playPreview(safeTrack);
    } else {
      window.open(
        `https://open.spotify.com/track/${safeTrack.spotifyId}`,
        "_blank",
        "noopener"
      );
    }
  };

  const playTitle = deviceId
    ? "Play"
    : safeTrack.preview_url
    ? "Play 30s preview"
    : "Open in Spotify";

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

  return (
    <div className="track-card">
      <img
        src={safeTrack.albumUrl || "/default-playlist.png"}
        className="track-image"
        alt={safeTrack.title}
        onClick={handlePlay}
      />

      <div className="track-info">
        <div className="track-title">{safeTrack.title}</div>
        <div className="track-artist">{safeTrack.artist}</div>
      </div>

      <div className="track-actions">
        <button onClick={handlePlay} title={playTitle}>
          {isPreviewing ? <FaPause /> : <FaPlay />}
        </button>

        <button onClick={handleQueue} title="Add to queue">
          <FaList />
        </button>

        <button onClick={handleLike} title={liked ? "Unlike" : "Like"}>
          {liked ? <FaHeart color="red" /> : <FaRegHeart />}
        </button>

        {/* Add-to-playlist dropdown */}
        <div className="playlist-dropdown-wrapper" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown((p) => !p);
            }}
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
