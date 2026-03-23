import { useEffect, useState, useContext, useRef } from "react";
import { PlayerContext } from "../context/PlayerContext";
import "../css/SpotifyPlayer.css";

function SpotifyPlayer() {
  const { currentTrack, setCurrentTrack, playNext } = useContext(PlayerContext);

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [paused, setPaused] = useState(true);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1); // ✅ prevent divide issues
  const [volume, setVolume] = useState(0.5);

  const accessToken = localStorage.getItem("spotify_access_token");

  const lastPlayedTrack = useRef(null);
  const isPlayingRef = useRef(false);

  const formatTime = (ms = 0) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  };

  // INIT PLAYER
  useEffect(() => {
    if (!accessToken || player) return;

    const initPlayer = () => {
      const p = new window.Spotify.Player({
        name: "SignalFM Player",
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      p.addListener("ready", async ({ device_id }) => {
        setDeviceId(device_id);

        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        });
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
  }, [accessToken, player]);

  const playCurrentTrack = async () => {
    if (!currentTrack || !deviceId || !accessToken) return;

    if (lastPlayedTrack.current === currentTrack.spotifyId) return;
    if (isPlayingRef.current) return;

    isPlayingRef.current = true;

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
    }, 1500);
  };

  useEffect(() => {
    if (!deviceId || !currentTrack) return;

    const timer = setTimeout(playCurrentTrack, 800);
    return () => clearTimeout(timer);
  }, [currentTrack?.spotifyId, deviceId]);

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
        <input type="range" min="0" max={duration} value={position} readOnly />
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
            player?.setVolume(v);
          }}
        />
      </div>
    </div>
  );
}

export default SpotifyPlayer;
