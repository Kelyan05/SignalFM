import { useTrackEvents } from "../hooks/useTrackEvents";
import { useLikedTracks } from "../context/LikedTracksProvider";
import { FaHeart, FaRegHeart, FaTrashAlt } from "react-icons/fa";

function TrackCard({ track, onRemove }) {
  const { like, unlike } = useTrackEvents();

  // from provider (global state)
  const { isLiked, fetchLikedTracks } = useLikedTracks();

  const liked = isLiked(track.spotifyId);

  const handleLike = async () => {
    if (liked) {
      await unlike(track.spotifyId);
    } else {
      await like(track.spotifyId);
    }

    // refresh global state so ALL pages update
    await fetchLikedTracks();
  };

  return (
    <div className="track-card">
      <img src={track.albumUrl || track.image} alt={track.title} />

      <div>{track.title}</div>
      <div>{track.artist}</div>

      <button onClick={handleLike}>
        {liked ? <FaHeart color="red" /> : <FaRegHeart />}
      </button>

      {onRemove && (
        <button onClick={() => onRemove(track.spotifyId)}>
          <FaTrashAlt />
        </button>
      )}
    </div>
  );
}

export default TrackCard;
