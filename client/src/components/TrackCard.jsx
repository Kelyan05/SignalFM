import { FaTrashAlt } from "react-icons/fa";
import { useState } from "react";

function TrackCard({ track, token, onRemove, onLike }) {
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) return; // prevent double liking
    try {
      // Call your backend like endpoint
      const res = await fetch(
        `https://signalfm-site.onrender.com/api/tracks/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ trackId: track.id }),
        }
      );

      if (res.ok) {
        setLiked(true); // update UI state
        onLike(track.id); // optional: notify parent component
      } else {
        console.error("Failed to like track");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="track-card">
      <img
        src={track.albumUrl || "https://via.placeholder.com/200"}
        className="track-image"
      />

      <div className="track-title">{track.title}</div>
      <div className="track-artist">{track.artist}</div>
      <button onClick={handleLike} disabled={liked}>
        {liked ? "Liked ❤️" : "Like ♡"}
      </button>
      <button className="remove-btn" onClick={() => onRemove(track.spotifyId)}>
        <FaTrashAlt />
      </button>
    </div>
  );
}

export default TrackCard;
