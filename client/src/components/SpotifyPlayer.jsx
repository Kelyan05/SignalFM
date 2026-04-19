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
  const {
    currentTrack,
    setDeviceId,
    deviceId,
    queue,
    removeFromQueue,
    playNext,
  } = useContext(PlayerContext);

  const [isLiked, setIsLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // progress state
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setIsLiked(false);
  }, [currentTrack?.spotifyId]);

  const { like, unlike, skip: sendSkip } = useTrackEvents();

  const {
    isPlaying,
    playerReady,
    volume,
    playPause,
    previous,
    setVolume,
    player,
  } = useSpotifyPlayer(setDeviceId);

  // Track progress
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (!state) return;

      setProgress(state.position);
      setDuration(state.duration);

      // AUTO PLAY NEXT WHEN SONG ENDS
      if (state.paused && state.position === 0 && queue.length > 0) {
        playNext();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, queue, playNext]);

  // PLAY TRACK WHEN IT CHANGES
  useEffect(() => {
    if (!currentTrack || !deviceId) return;

    const token = localStorage.getItem("spotify_access_token");
    if (!token) return;

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [`spotify:track:${currentTrack.spotifyId}`],
      }),
    }).catch((err) => console.error("[SpotifyPlayer] play failed:", err));
  }, [currentTrack, deviceId]);

  if (!currentTrack) return null;

  const handleLike = () => {
    if (isLiked) {
      unlike(currentTrack.spotifyId);
    } else {
      like(currentTrack.spotifyId);
    }
    setIsLiked((prev) => !prev);
    window.dispatchEvent(new Event("recommendationUpdate"));
  };

  // FIXED SKIP
  const handleSkip = () => {
    sendSkip(currentTrack.spotifyId);

    if (queue.length > 0) {
      playNext(); // 🔥 YOUR QUEUE
    }
  };

  // format time
  const formatTime = (ms) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <>
      <div className="spotify-player">
        {/* TRACK */}
        <div className="player-track-info">
          <img
            src={
              currentTrack.albumUrl ||
              currentTrack.image ||
              "https://via.placeholder.com/200"
            }
            alt={currentTrack.title}
            className="player-album-art"
          />
          <div className="player-meta">
            <span className="player-title">{currentTrack.title}</span>
            <span className="player-artist">{currentTrack.artist}</span>
          </div>
        </div>

        {/* CONTROLS */}
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
            {isLiked ? <FaHeart color="red" /> : <FaRegHeart />}
          </button>
        </div>

        {/* RIGHT */}
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

          <button onClick={() => setShowQueue((p) => !p)}>
            <MdQueueMusic />
            {queue.length > 0 && (
              <span className="queue-badge">{queue.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="player-progress">
        <span>{formatTime(progress)}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>

      {/* QUEUE */}
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
                  <img src={t.albumUrl || t.image} alt="" />
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
