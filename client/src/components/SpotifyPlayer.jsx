import { useEffect, useState, useContext, useRef } from "react";
import { PlayerContext } from "../context/PlayerContext";
import "../css/SpotifyPlayer.css";

function SpotifyPlayer({ ws }) {
  const { currentTrack, setCurrentTrack, playNext } = useContext(PlayerContext);

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(0.5);

  const lastPlayedTrack = useRef(null);
  const isPlayingRef = useRef(false);
  const refreshPromise = useRef(null);
  const reconnectTimeout = useRef(null);

  // FORMAT MS
  const formatTime = (ms = 0) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  };

  // GET TOKEN
  const getValidToken = async () => {
    const storedToken = localStorage.getItem("spotify_access_token");
    const expiry = localStorage.getItem("spotify_token_expiry");
    if (storedToken && expiry && Date.now() < Number(expiry))
      return storedToken;

    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      const res = await fetch(
        `http://127.0.0.1:3001/api/spotify/token?refresh_token=${refreshToken}`
      );
      const data = await res.json();
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem("spotify_token_expiry", Date.now() + 55 * 60 * 1000);
      refreshPromise.current = null;
      return data.access_token;
    })();

    return refreshPromise.current;
  };

  // INITIALIZE PLAYER
  useEffect(() => {
    if (player) return;
    const initPlayer = () => {
      const p = new window.Spotify.Player({
        name: "SignalFM Player",
        getOAuthToken: async (cb) => cb(await getValidToken()),
        volume: 0.5,
      });

      p.addListener("ready", async ({ device_id }) => {
        setDeviceId(device_id);
        const token = await getValidToken();
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ device_ids: [device_id], play: false }),
        });
        p.getVolume().then(setVolume);
      });

      p.addListener("not_ready", () => {
        if (reconnectTimeout.current) return;
        reconnectTimeout.current = setTimeout(() => {
          p.connect();
          reconnectTimeout.current = null;
        }, 3000);
      });

      p.addListener("player_state_changed", (state) => {
        if (!state) return;
        setPaused(state.paused);
        setPosition(state.position || 0);
        setDuration(state.duration || 1);

        const track = state.track_window.current_track;
        if (!track) return;

        setCurrentTrack({
          spotifyId: track.id,
          title: track.name,
          artist: track.artists?.[0]?.name || "Unknown",
          image: track.album?.images?.[0]?.url || "",
        });

        // send WebSocket update for play/skip
        if (ws && track.id !== lastPlayedTrack.current) {
          ws.send(
            JSON.stringify({
              type: "recommendationUpdate",
              action: state.paused ? "skip" : "play",
              trackId: track.id,
            })
          );
        }

        if (state.paused && state.position === state.duration) {
          playNext();
        }
      });

      p.connect();
      setPlayer(p);
    };

    if (!window.Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    } else initPlayer();
  }, [player, ws]);

  // SEEK
  const handleSeek = async (value) => {
    setPosition(value);
    try {
      const token = await getValidToken();
      await fetch(
        `https://api.spotify.com/v1/me/player/seek?position_ms=${value}&device_id=${deviceId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  // VOLUME
  const handleVolume = (v) => {
    setVolume(v);
    if (player) player.setVolume(v);
  };

  if (!currentTrack) return null;

  return (
    <div className="player-bar">
      <div className="player-info">
        <img src={currentTrack.image || ""} alt={currentTrack.title} />
        <div>
          <p>{currentTrack.title}</p>
          <p>{currentTrack.artist}</p>
        </div>
      </div>

      <div className="player-controls">
        <button onClick={() => player?.previousTrack()}>Prev</button>
        <button onClick={() => player?.togglePlay()}>
          {paused ? "Play" : "Pause"}
        </button>
        <button onClick={() => player?.nextTrack()}>Next</button>
        <button
          onClick={async () => {
            // Like track
            if (ws && currentTrack) {
              ws.send(
                JSON.stringify({
                  type: "recommendationUpdate",
                  action: "like",
                  trackId: currentTrack.spotifyId,
                })
              );
            }
          }}
        >
          Like
        </button>
      </div>

      <div className="player-progress">
        <span>{formatTime(position)}</span>
        <input
          type="range"
          min="0"
          max={duration}
          value={position}
          onChange={(e) => handleSeek(Number(e.target.value))}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div className="player-volume">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => handleVolume(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export default SpotifyPlayer;
