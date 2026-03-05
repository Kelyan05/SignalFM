import { FaTrashAlt } from "react-icons/fa";

function TrackCard({ track, onRemove }) {
  return (
    <div className="track-card">
      <img
        src={track.albumUrl || "https://via.placeholder.com/200"}
        className="track-image"
      />

      <div className="track-title">{track.title}</div>
      <div className="track-artist">{track.artist}</div>

      <button className="remove-btn" onClick={() => onRemove(track.spotifyId)}>
        <FaTrashAlt />
      </button>
    </div>
  );
}

export default TrackCard;
