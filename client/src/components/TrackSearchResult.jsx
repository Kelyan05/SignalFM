import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { useTrackEvents } from "../hooks/useTrackEvents";
import { normalizeTrack } from "../utils/normalizeTrack";
import { useLikedTracks } from "../context/LikedTracksProvider";

import { FaHeart, FaRegHeart, FaPlay, FaList } from "react-icons/fa";

function TrackSearchResult({ track }) {
  const { setCurrentTrack, addToQueue } = useContext(PlayerContext);
  const { like, unlike, queue: queueEvent } = useTrackEvents();
  const { isLiked, fetchLikedTracks } = useLikedTracks();

  const liked = isLiked(track.spotifyId);

  const handleLike = async () => {
    if (liked) {
      await unlike(track.spotifyId);
    } else {
      await like(track.spotifyId);
    }

    await fetchLikedTracks(); // global sync
  };

  const handlePlay = () => {
    setCurrentTrack(normalizeTrack(track));
  };

  const handleQueue = () => {
    const safe = normalizeTrack(track);
    addToQueue(safe);
    queueEvent(safe.spotifyId);
  };

  return (
    <div className="track-card">
      <img
        src={track.albumUrl}
        className="track-image"
        alt={track.title}
        onClick={handlePlay}
      />

      <div className="track-info">
        <div>{track.title}</div>
        <div>{track.artist}</div>
      </div>

      <div className="track-actions">
        <button onClick={handlePlay}>
          <FaPlay />
        </button>
        <button onClick={handleQueue}>
          <FaList />
        </button>

        <button onClick={handleLike}>
          {liked ? <FaHeart color="red" /> : <FaRegHeart />}
        </button>
      </div>
    </div>
  );
}

export default TrackSearchResult;
