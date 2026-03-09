import { useState } from "react";
import { PlayerContext } from "./PlayerContext";

export function PlayerProvider({ children }) {
  const [track, setTrack] = useState(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <PlayerContext.Provider
      value={{
        track,
        setTrack,
        player,
        setPlayer,
        isPlaying,
        setIsPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
