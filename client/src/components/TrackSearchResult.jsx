import { useContext, useState, useRef, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { useTrackEvents } from "../hooks/useTrackEvents";

import { FaPlusCircle, FaHeart, FaPlay, FaList } from "react-icons/fa";
import "../css/TrackSearchResult.css";

function TrackSearchResult({ track, playlists = [], onAddToPlaylist }) {
  const { setCurrentTrack, addToQueue } = useContext(PlayerContext);
  const { recordEvent } = useTrackEvents();

  const [liked, setLiked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLike = async () => {
    const action = liked ? "unlike" : "like";

    await recordEvent(track.spotifyId, action);

    setLiked(!liked);

    window.dispatchEvent(new Event("recommendationUpdate"));
  };

  // Dropdown toggle
  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  // Click outside close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="track-card">
      <img
        src={track.albumUrl || track.image || "https://via.placeholder.com/200"}
        className="track-image"
        onClick={() => setCurrentTrack(track)}
      />

      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
      </div>

      <div className="track-actions">
        <button onClick={() => setCurrentTrack(track)}>
          <FaPlay />
        </button>

        <button onClick={() => addToQueue(track)}>
          <FaList />
        </button>

        <button onClick={handleLike}>
          {liked ? <FaHeart color="red" /> : <FaHeart />}
        </button>

        {/* Playlist dropdown */}
        <div className="playlist-dropdown-wrapper" ref={dropdownRef}>
          <button onClick={handleToggleDropdown}>
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
                      onAddToPlaylist?.(p.id, track);
                      setShowDropdown(false);
                    }}
                  >
                    {p.name}
                  </div>
                ))
              ) : (
                <div className="playlist-option disabled">No playlists</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackSearchResult;
