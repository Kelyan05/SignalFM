import { useState } from "react";
import { PlayerContext } from "./PlayerContext";

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  // Play a track immediately
  const playTrack = async (track) => {
    setCurrentTrack(track);

    if (spotifyPlayer && deviceId && track.accessToken) {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ uris: [`spotify:track:${track.spotifyId}`] }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${track.accessToken}`,
          },
        }
      );
    }
  };

  const addToQueue = (track) => setQueue((prev) => [...prev, track]);

  const playNext = () => {
    setQueue((prev) => {
      if (!prev.length) return prev;
      const next = prev[0];
      playTrack(next);
      return prev.slice(1);
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        playTrack,
        addToQueue,
        playNext,
        setCurrentTrack,
        spotifyPlayer,
        setSpotifyPlayer,
        deviceId,
        setDeviceId,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
