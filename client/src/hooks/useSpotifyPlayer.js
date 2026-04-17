import { useEffect, useRef, useState, useCallback } from "react";

export function useSpotifyPlayer(setDeviceIdExternal) {
  const playerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  // ── Initialize Spotify Web Playback SDK
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
        setDeviceIdExternal?.(device_id);
        setPlayerReady(true);
      });

      player.addListener("not_ready", () => setPlayerReady(false));

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
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
  }, [setDeviceIdExternal, volume]);

  // ── Controls
  const playPause = useCallback(() => {
    playerRef.current?.togglePlay();
  }, []);

  const skip = useCallback(() => {
    playerRef.current?.nextTrack();
  }, []);

  const previous = useCallback(() => {
    playerRef.current?.previousTrack();
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    playerRef.current?.setVolume(v);
  }, []);

  return {
    isPlaying,
    playerReady,
    volume,
    playPause,
    skip,
    previous,
    setVolume,
  };
}