import { useTrackEvents } from "../hooks/useTrackEvents";
import { useLikedTracks } from "../hooks/useLikedTracks";
import { FaHeart, FaRegHeart, FaTrashAlt } from "react-icons/fa";

function TrackCard({ track, onRemove }) {
  const { like, unlike } = useTrackEvents();
  const { isLiked } = useLikedTracks();

  // isLiked reads from the global provider, so this is always in sync
  // with TrackSearchResult and SpotifyPlayer on every other page.
  const liked = isLiked(track.spotifyId);

  // Pass the full track object so like() can write metadata to Firestore.
  const handleLike = () => {
    if (liked) {
      unlike(track);
    } else {
      like(track);
    }
  };

  return (
    <div className="track-card">
      <img
        src={track.albumUrl || track.image || "/default-playlist.png"}
        alt={track.title}
        className="track-image"
      />

      <div className="track-title">{track.title}</div>
      <div className="track-artist">{track.artist}</div>

      <div className="track-actions">
        <button onClick={handleLike} title={liked ? "Unlike" : "Like"}>
          {liked ? <FaHeart color="red" /> : <FaRegHeart />}
        </button>

        {onRemove && (
          <button
            onClick={() => onRemove(track.spotifyId)}
            title="Remove from playlist"
          >
            <FaTrashAlt />
          </button>
        )}
      </div>
    </div>
  );
}

export default TrackCard;
