import { FaTrashAlt, FaHeart } from "react-icons/fa";
import { useTrackEvents } from "../hooks/useTrackEvents";

function TrackCard({ track }) {
  const { like } = useTrackEvents();

  return (
    <div className="track-card">
      <img
        src={track.albumUrl || "https://via.placeholder.com/200"}
        className="track-image"
      />

      <div className="track-title">{track.title}</div>
      <div className="track-artist">{track.artist}</div>

      <button onClick={() => like(track.spotifyId)}>
        <>
          <FaHeart color="red" /> Liked
        </>
      </button>
    </div>
  );
}

export default TrackCard;
