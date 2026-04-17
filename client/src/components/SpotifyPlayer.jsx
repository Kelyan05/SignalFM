import { useState, useContext, useEffect } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { useTrackEvents } from "../hooks/useTrackEvents";

import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaHeart,
  FaRegHeart,
  FaVolumeUp,
  FaVolumeDown,
  FaList,
  FaTimes,
} from "react-icons/fa";
import { MdQueueMusic } from "react-icons/md";

import "../css/SpotifyPlayer.css";

export default function SpotifyPlayer() {
  const { currentTrack, setDeviceId, deviceId, queue, removeFromQueue } =
    useContext(PlayerContext);

  const [isLiked, setIsLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const {
    isPlaying,
    playerReady,
    volume,
    playPause,
    skip,
    previous,
    setVolume,
  } = useSpotifyPlayer(setDeviceId);

  const { recordEvent } = useTrackEvents();

  if (!currentTrack) return null;

  const handleLike = () => {
    recordEvent(currentTrack.spotifyId, isLiked ? "unlike" : "like");
    setIsLiked((prev) => !prev);
  };

  const handleSkip = () => {
    recordEvent(currentTrack.spotifyId, "skip");
    skip();
  };

  return (
    <>
      <div className="spotify-player">
        <div className="player-track-info">
          {currentTrack.albumUrl && (
            <img
              src={currentTrack.albumUrl}
              alt={currentTrack.title}
              className="player-album-art"
            />
          )}
          <div className="player-meta">
            <span className="player-title">{currentTrack.title}</span>
            <span className="player-artist">{currentTrack.artist}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="player-controls">
          <button onClick={previous} disabled={!playerReady}>
            <FaStepBackward />
          </button>

          <button onClick={playPause} disabled={!playerReady}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          <button onClick={handleSkip} disabled={!playerReady}>
            <FaStepForward />
          </button>

          <button onClick={handleLike} disabled={!playerReady}>
            {isLiked ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>

        {/* Volume + Queue */}
        <div className="player-right">
          <div className="player-volume">
            <FaVolumeDown />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
            <FaVolumeUp />
          </div>

          <button onClick={() => setShowQueue((prev) => !prev)}>
            <MdQueueMusic />
            {queue.length > 0 && (
              <span className="queue-badge">{queue.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Queue */}
      {showQueue && (
        <div className="queue-panel">
          <div className="queue-panel-header">
            <span>
              <FaList /> Up next ({queue.length})
            </span>
            <button onClick={() => setShowQueue(false)}>
              <FaTimes />
            </button>
          </div>

          {queue.length === 0 ? (
            <p>Your queue is empty</p>
          ) : (
            <ul>
              {queue.map((t, i) => (
                <li key={`${t.spotifyId}-${i}`}>
                  <img src={t.albumUrl} alt="" />
                  <div>
                    <span>{t.title}</span>
                    <span>{t.artist}</span>
                  </div>
                  <button onClick={() => removeFromQueue(i)}>
                    <FaTimes />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
