import { useEffect, useRef, useState, useCallback } from "react";

export function useSpotifyPlayer(setDeviceIdExternal) {
  const playerRef = useRef(null);
  const sdkReadyRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  useEffect(() => {
    if (sdkReadyRef.current) return;

    sdkReadyRef.current = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = localStorage.getItem("spotify_access_token");

      if (!token) {
        console.warn("No Spotify token found");
        return;
      }

      const player = new window.Spotify.Player({
        name: "SignalFM Player",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      player.addListener("ready", ({ device_id }) => {
        console.log("Spotify ready:", device_id);
        setDeviceIdExternal?.(device_id);
        setPlayerReady(true);
      });

      player.addListener("not_ready", () => {
        console.warn("Spotify not ready");
        setPlayerReady(false);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
      });

      player.connect();
      playerRef.current = player;
    };

    if (!document.getElementById("spotify-sdk")) {
      const script = document.createElement("script");
      script.id = "spotify-sdk";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady();
    }

    return () => {
      playerRef.current?.disconnect();
    };
  }, [setDeviceIdExternal]);


  const playPause = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.togglePlay();
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