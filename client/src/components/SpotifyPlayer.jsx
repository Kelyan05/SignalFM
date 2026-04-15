import { useEffect, useRef, useState, useContext, useCallback } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";
import { auth } from "../config/firebase.js";
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

const SKIP_THRESHOLD_MS = 30_000;

export default function SpotifyPlayer() {
  const { currentTrack, setDeviceId, queue, removeFromQueue } =
    useContext(PlayerContext);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [playerReady, setPlayerReady] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const playerRef = useRef(null);
  const trackStartRef = useRef(null);
  const prevTrackRef = useRef(null);

  // ── HTTP event recorder ───────────────────────────────────────────────────
  const recordEvent = useCallback(async (trackId, action) => {
    if (!trackId) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await fetch(`${import.meta.env.VITE_API_URL}/api/track/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackId, action }),
      });
    } catch (err) {
      console.error("recordEvent failed:", err);
    }
  }, []);

  // ── Spotify Web Playback SDK ──────────────────────────────────────────────
  useEffect(() => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = localStorage.getItem("spotify_access_token");
      if (!token) return;

      const player = new window.Spotify.Player({
        name: "SignalFM Player",
        getOAuthToken: (cb) => cb(token),
        volume,
      });

      player.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
        setPlayerReady(true);
      });

      player.addListener("not_ready", () => setPlayerReady(false));

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        const newTrackId = state.track_window?.current_track?.id;
        setIsPlaying(!state.paused);

        if (newTrackId && newTrackId !== prevTrackRef.current) {
          if (prevTrackRef.current && trackStartRef.current) {
            const elapsed = Date.now() - trackStartRef.current;
            recordEvent(
              prevTrackRef.current,
              elapsed < SKIP_THRESHOLD_MS ? "skip" : "play"
            );
          }
          prevTrackRef.current = newTrackId;
          trackStartRef.current = Date.now();
          setIsLiked(false);
        }
      });

      player.connect();
      playerRef.current = player;
    };

    if (!window.Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      window.onSpotifyWebPlaybackSDKReady();
    }

    return () => playerRef.current?.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Controls ──────────────────────────────────────────────────────────────
  const handlePlayPause = () => playerRef.current?.togglePlay();

  const handleSkip = () => {
    if (prevTrackRef.current) recordEvent(prevTrackRef.current, "skip");
    playerRef.current?.nextTrack();
  };

  const handlePrev = () => playerRef.current?.previousTrack();

  const handleLike = () => {
    if (!prevTrackRef.current) return;
    recordEvent(prevTrackRef.current, isLiked ? "unlike" : "like");
    setIsLiked((prev) => !prev);
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  if (!currentTrack) return null;

  return (
    <>
      <div className="spotify-player">
        {/* Track info */}
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
          <button
            className="player-btn"
            onClick={handlePrev}
            disabled={!playerReady}
            title="Previous"
          >
            <FaStepBackward />
          </button>

          <button
            className="player-btn player-btn--primary"
            onClick={handlePlayPause}
            disabled={!playerReady}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          <button
            className="player-btn"
            onClick={handleSkip}
            disabled={!playerReady}
            title="Skip"
          >
            <FaStepForward />
          </button>

          <button
            className={`player-btn${isLiked ? " player-btn--liked" : ""}`}
            onClick={handleLike}
            disabled={!playerReady}
            title={isLiked ? "Unlike" : "Like"}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>

        {/* Volume + queue toggle */}
        <div className="player-right">
          <div className="player-volume">
            <FaVolumeDown className="volume-icon" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolume}
              className="player-volume-slider"
              title="Volume"
            />
            <FaVolumeUp className="volume-icon" />
          </div>

          <button
            className={`player-btn player-btn--queue${
              showQueue ? " player-btn--queue-active" : ""
            }`}
            onClick={() => setShowQueue((prev) => !prev)}
            title="Queue"
          >
            <MdQueueMusic />
            {queue.length > 0 && (
              <span className="queue-badge">{queue.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Queue panel */}
      {showQueue && (
        <div className="queue-panel">
          <div className="queue-panel-header">
            <span>
              <FaList style={{ marginRight: 8 }} />
              Up next ({queue.length})
            </span>
            <button
              className="queue-close-btn"
              onClick={() => setShowQueue(false)}
            >
              <FaTimes />
            </button>
          </div>

          {queue.length === 0 ? (
            <p className="queue-empty">Your queue is empty</p>
          ) : (
            <ul className="queue-list">
              {queue.map((t, i) => (
                <li key={`${t.spotifyId}-${i}`} className="queue-item">
                  <img
                    src={t.albumUrl || "https://via.placeholder.com/40"}
                    alt={t.title}
                    className="queue-item-art"
                  />
                  <div className="queue-item-info">
                    <span className="queue-item-title">{t.title}</span>
                    <span className="queue-item-artist">{t.artist}</span>
                  </div>
                  <button
                    className="queue-item-remove"
                    onClick={() => removeFromQueue(i)}
                    title="Remove"
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
