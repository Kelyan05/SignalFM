import { useEffect, useState, useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import "../css/SpotifyPlayer.css";

function SpotifyPlayer() {
  const { currentTrack, setCurrentTrack, playNext } = useContext(PlayerContext);

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);

  // Get token from localStorage
  const accessToken = localStorage.getItem("spotify_access_token");

  // Format time mm:ss
  const formatTime = (ms) =>
    `${Math.floor(ms / 60000)}:${Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0")}`;

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;

    const initPlayer = () => {
      const playerInstance = new window.Spotify.Player({
        name: "SignalFM Player",
        getOAuthToken: (cb) => cb(accessToken),
        volume: volume,
      });

      // Ready
      playerInstance.addListener("ready", async ({ device_id }) => {
        console.log("Player ready:", device_id);

        setDeviceId(device_id);

        // transfer playback to this web player
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        });
      });

      // Playback state
      playerInstance.addListener("player_state_changed", (state) => {
        if (!state) return;
        const track = state.track_window.current_track;
        setCurrentTrack({
          spotifyId: track.id,
          title: track.name,
          artist: track.artists[0].name,
          image: track.album.images[0].url,
        });
        setPosition(state.position);
        setDuration(state.duration);
        setPaused(state.paused);

        // Auto-play next in queue if finished
        if (state.paused && state.position === state.duration) {
          playNext();
        }
      });

      playerInstance.connect();
      setPlayer(playerInstance);
    };

    if (!window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      initPlayer();
    }
  }, [accessToken]);

  // Play selected track
  const playCurrentTrack = async () => {
    if (!currentTrack || !deviceId || !accessToken) return;

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            uris: [`spotify:track:${currentTrack.spotifyId}`],
          }),
        }
      );
    } catch (err) {
      console.error("Failed to play track:", err);
    }
  };

  // Call this only when user clicks play

  if (!currentTrack) return null;

  return (
    <div className="player-bar">
      <div className="player-info">
        <img src={currentTrack.image} alt={currentTrack.title} />
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
            setVolume(e.target.value);
            player?.setVolume(e.target.value);
          }}
        />
      </div>
    </div>
  );
}

export default SpotifyPlayer;
