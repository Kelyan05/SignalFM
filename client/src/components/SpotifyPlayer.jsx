import { useState, useContext, useEffect, useRef } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { useTrackEvents } from "../hooks/useTrackEvents";
import { useLikedTracks } from "../context/LikedTracksProvider";

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
  FaRandom,
  FaRedo,
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
    setQueue,
  } = useContext(PlayerContext);

  const [showQueue, setShowQueue] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  // Refs so setInterval closure always sees latest values without re-creating
  const loopRef = useRef(loop);
  const shuffleRef = useRef(shuffle);
  const queueRef = useRef(queue);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const { like, unlike, skip: sendSkip } = useTrackEvents();
  const { isLiked } = useLikedTracks();

  const {
    isPlaying,
    playerReady,
    volume,
    playPause,
    previous,
    setVolume,
    player,
  } = useSpotifyPlayer(setDeviceId);

  // Start playback when currentTrack or deviceId changes
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

  // Poll SDK every second: update progress + auto-advance on track end
  useEffect(() => {
    if (!player) return;
    const id = setInterval(async () => {
      const state = await player.getCurrentState();
      if (!state) return;
      setProgress(state.position);
      setDuration(state.duration);

      if (state.paused && state.position === 0 && state.duration > 0) {
        if (loopRef.current) {
          player.seek(0).then(() => player.resume());
        } else if (queueRef.current.length > 0) {
          if (shuffleRef.current) {
            const ri = Math.floor(Math.random() * queueRef.current.length);
            const r = [...queueRef.current];
            [r[0], r[ri]] = [r[ri], r[0]];
            setQueue(r);
          }
          playNext();
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [player, playNext, setQueue]);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.spotifyId);

  const handleLike = () => {
    if (liked) unlike(currentTrack);
    else like(currentTrack);
  };

  const handleSkip = () => {
    sendSkip(currentTrack.spotifyId);
    if (queue.length > 0) {
      if (shuffle) {
        const ri = Math.floor(Math.random() * queue.length);
        const r = [...queue];
        [r[0], r[ri]] = [r[ri], r[0]];
        setQueue(r);
      }
      playNext();
    }
  };

  const handleShuffle = () => {
    const next = !shuffle;
    setShuffle(next);
    if (next && queue.length > 1) {
      setQueue([...queue].sort(() => Math.random() - 0.5));
    }
  };

  const fmt = (ms) => {
    if (!ms || ms <= 0) return "0:00";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;

  return (
    <>
      {/* ── Player bar ── */}
      <div className="spotify-player">
        {/* Track info */}
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

        {/* Controls */}
        <div className="player-controls">
          <button
            onClick={handleShuffle}
            title="Shuffle"
            className={shuffle ? "btn-active" : ""}
          >
            <FaRandom />
          </button>
          <button onClick={previous} disabled={!playerReady} title="Previous">
            <FaStepBackward />
          </button>
          <button
            onClick={playPause}
            disabled={!playerReady}
            className="btn-play-pause"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={handleSkip} disabled={!playerReady} title="Skip">
            <FaStepForward />
          </button>
          <button
            onClick={() => setLoop((p) => !p)}
            title={loop ? "Disable loop" : "Loop"}
            className={loop ? "btn-active" : ""}
          >
            <FaRedo />
          </button>
          <button
            onClick={handleLike}
            disabled={!playerReady}
            title={liked ? "Unlike" : "Like"}
            className={liked ? "btn-liked" : ""}
          >
            {liked ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>

        {/* Right: volume + queue */}
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
              aria-label="Volume"
            />
            <FaVolumeUp />
          </div>
          <button
            onClick={() => setShowQueue((p) => !p)}
            title="Queue"
            className={showQueue ? "btn-active" : ""}
            style={{ position: "relative" }}
          >
            <MdQueueMusic style={{ fontSize: 18 }} />
            {queue.length > 0 && (
              <span className="queue-badge">{queue.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Progress strip ── */}
      <div className="player-progress">
        <span>{fmt(progress)}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span>{fmt(duration)}</span>
      </div>

      {/* ── Queue panel ── */}
      {showQueue && (
        <div className="queue-panel">
          <div className="queue-panel-header">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaList /> Up next ({queue.length})
              {shuffle && (
                <span style={{ color: "#1db954", fontSize: 11 }}>
                  ● shuffle
                </span>
              )}
              {loop && (
                <span style={{ color: "#1db954", fontSize: 11 }}>● loop</span>
              )}
            </span>
            <button onClick={() => setShowQueue(false)} aria-label="Close">
              <FaTimes />
            </button>
          </div>

          {queue.length === 0 ? (
            <p
              style={{
                padding: "28px 16px",
                textAlign: "center",
                color: "#555",
                fontSize: 13,
              }}
            >
              Queue is empty
            </p>
          ) : (
            <ul className="queue-list">
              {queue.map((t, i) => (
                <li key={`${t.spotifyId}-${i}`} className="queue-item">
                  <img
                    src={
                      t.albumUrl || t.image || "https://via.placeholder.com/38"
                    }
                    alt=""
                  />
                  <div className="queue-item-info">
                    <span className="queue-item-title">{t.title}</span>
                    <span className="queue-item-artist">{t.artist}</span>
                  </div>
                  <button
                    className="queue-item-remove"
                    onClick={() => removeFromQueue(i)}
                    aria-label="Remove"
                  >
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
