import { useEffect, useState, useContext, useRef } from "react";
import { PlayerContext } from "../context/PlayerContext";
import "../css/SpotifyPlayer.css";

function SpotifyPlayer() {
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

  // Format ms to mm:ss
  const formatTime = (ms = 0) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  };

  // Get valid access token, refreshing if needed
  const getValidToken = async () => {
    const storedToken = localStorage.getItem("spotify_access_token");
    const expiry = localStorage.getItem("spotify_token_expiry");

    if (storedToken && expiry && Date.now() < Number(expiry)) {
      return storedToken;
    }

    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      try {
        const refreshToken = localStorage.getItem("spotify_refresh_token");

        const res = await fetch(
          `http://127.0.0.1:3001/api/spotify/token?refresh_token=${refreshToken}`
        );

        const data = await res.json();

        if (!data.access_token) throw new Error("No token");

        const expiresInMs = 55 * 60 * 1000;

        localStorage.setItem("spotify_access_token", data.access_token);
        localStorage.setItem("spotify_token_expiry", Date.now() + expiresInMs);

        return data.access_token;
      } catch (err) {
        console.error("Token refresh failed:", err);
        window.location.href = "/login";
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  };

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (player) return;

    const initPlayer = () => {
      const p = new window.Spotify.Player({
        name: "SignalFM Player",
        getOAuthToken: async (cb) => {
          const token = await getValidToken();
          cb(token);
        },
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
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        });

        // sync volume from player
        p.getVolume().then(setVolume);
      });

      p.addListener("not_ready", () => {
        console.warn("Player disconnected. Reconnecting...");

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
    } else {
      initPlayer();
    }
  }, [player]);

  // play current track when it changes
  const playCurrentTrack = async () => {
    if (!currentTrack || !deviceId) return;

    if (lastPlayedTrack.current === currentTrack.spotifyId) return;
    if (isPlayingRef.current) return;

    isPlayingRef.current = true;

    try {
      const token = await getValidToken();

      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${currentTrack.spotifyId}`],
          }),
        }
      );

      lastPlayedTrack.current = currentTrack.spotifyId;
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      isPlayingRef.current = false;
    }, 1200);
  };

  useEffect(() => {
    if (!deviceId || !currentTrack) return;

    const timer = setTimeout(playCurrentTrack, 500);
    return () => clearTimeout(timer);
  }, [currentTrack?.spotifyId, deviceId]);

  // Seek function
  const handleSeek = async (value) => {
    setPosition(value);

    try {
      const token = await getValidToken();

      await fetch(
        `https://api.spotify.com/v1/me/player/seek?position_ms=${value}&device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Seek failed", err);
    }
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
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);

            if (player) {
              try {
                player.setVolume(v);
              } catch {
                console.warn("Volume error");
              }
            }
          }}
        />
      </div>
    </div>
  );
}

export default SpotifyPlayer;
