import { useContext, useState, useRef, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { FaPlusCircle, FaHeart, FaPlay, FaList } from "react-icons/fa";
import { auth } from "../config/firebase";
import "../css/TrackSearchResult.css";

function TrackSearchResult({ track, playlists = [], onAddToPlaylist }) {
  const { playTrack, addToQueue } = useContext(PlayerContext);
  const [liked, setLiked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLike = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const eventType = liked ? "unlike" : "like";

      await fetch(`${import.meta.env.VITE_API_URL}/api/track/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackId: track.spotifyId,
          action: "like",
        }),
      });

      setLiked(!liked);

      // Trigger recommendation refresh
      window.dispatchEvent(new Event("recommendationUpdate"));
    } catch (err) {
      console.error("Like failed:", err);
    }
  };
  // Toggle dropdown
  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  // Close when clicking outside
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
        onClick={() => playTrack(track)}
      />

      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
      </div>

      {/* Actions */}
      <div className="track-actions">
        <button onClick={() => playTrack(track)}>
          <FaPlay />
        </button>

        <button onClick={() => addToQueue(track)}>
          <FaList />
        </button>

        <button onClick={handleLike}>
          {liked ? <FaHeart color="red" /> : <FaHeart />}
        </button>

        {/* Playlist Dropdown */}
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
