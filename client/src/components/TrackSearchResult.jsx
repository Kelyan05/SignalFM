import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { FaPlusCircle, FaHeart } from "react-icons/fa";

function TrackSearchResult({ track, playlists }) {
  const { playTrack, addToQueue } = useContext(PlayerContext);

  return (
    <div className="track-card">
      <img
        src={track.albumUrl || track.image || "https://via.placeholder.com/200"}
        className="track-image"
      />
      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
      </div>

      <button onClick={(playCurrentTrack) => playTrack(track)}>Play</button>
      <button onClick={() => addToQueue(track)}>Queue</button>
      <button>
        <FaHeart />
      </button>
      <button>
        <FaPlusCircle />
      </button>
    </div>
  );
}

export default TrackSearchResult;
