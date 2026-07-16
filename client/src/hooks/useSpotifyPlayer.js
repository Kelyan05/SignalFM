import { useEffect, useRef, useState, useCallback } from "react";

export function useSpotifyPlayer(setDeviceIdExternal) {
  const playerRef   = useRef(null);
  const sdkReadyRef = useRef(false);

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [volume,      setVolumeState] = useState(0.5);

  useEffect(() => {
    if (sdkReadyRef.current) return;
    sdkReadyRef.current = true;

    const init = () => {
      const token = localStorage.getItem("spotify_access_token");
      if (!token) {
        console.warn("[useSpotifyPlayer] No Spotify access token found");
        return;
      }

      const player = new window.Spotify.Player({
        name: "SignalFM Player",
        getOAuthToken: (cb) => cb(localStorage.getItem("spotify_access_token")),
        volume: 0.5,
      });

      player.addListener("ready", ({ device_id }) => {
        setDeviceIdExternal?.(device_id);
        setPlayerReady(true);
      });

      player.addListener("not_ready", () => setPlayerReady(false));

      // Fires for accounts without Premium — the SDK cannot stream for them.
      // We don't set a device id, so the UI falls back to 30s previews /
      // open-in-Spotify links (see TrackSearchResult).
      player.addListener("account_error", ({ message }) => {
        console.warn("[useSpotifyPlayer] Spotify Premium required for in-app playback:", message);
        setPlayerReady(false);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
      });

      player.connect();
      playerRef.current = player;
    };

    window.onSpotifyWebPlaybackSDKReady = init;

    if (!document.getElementById("spotify-sdk")) {
      const script  = document.createElement("script");
      script.id     = "spotify-sdk";
      script.src    = "https://sdk.scdn.co/spotify-player.js";
      script.async  = true;
      document.body.appendChild(script);
    } else if (window.Spotify) {
      init();
    }

    return () => { playerRef.current?.disconnect(); };
  }, [setDeviceIdExternal]);

  const playPause = useCallback(() => { playerRef.current?.togglePlay(); }, []);
  const skip      = useCallback(() => { playerRef.current?.nextTrack(); }, []);
  const previous  = useCallback(() => { playerRef.current?.previousTrack(); }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    playerRef.current?.setVolume(v);
  }, []);

  /** Seek the current track to `ms` milliseconds — used by the progress scrubber */
  const seekTo = useCallback((ms) => {
    playerRef.current?.seek(ms);
  }, []);

  return { isPlaying, playerReady, volume, playPause, skip, previous, setVolume, seekTo, player: playerRef.current };
}