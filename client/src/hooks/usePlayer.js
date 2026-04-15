import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";

export const usePlayer = () => {
  const {
    currentTrack,
    isPlaying,
    queue,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    addToQueue,
    removeFromQueue,
  } = useContext(PlayerContext);

  return {
    currentTrack,
    isPlaying,
    queue,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    addToQueue,
    removeFromQueue,
  };
};