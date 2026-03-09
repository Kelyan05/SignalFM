import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import "../css/SpotifyPlayer.css";

function SpotifyPlayer() {
  const { currentTrack } = useContext(PlayerContext);

  if (!currentTrack) return null;

  return (
    <div className="spotify-player">
      <div className="player-info">
        <img src={currentTrack.image} alt={currentTrack.title} />
        <div>
          <p className="track-title">{currentTrack.title}</p>
          <p className="track-artist">{currentTrack.artist}</p>
        </div>
      </div>

      <iframe
        src={`https://open.spotify.com/embed/track/${currentTrack.spotifyId}`}
        width="300"
        height="80"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      ></iframe>
    </div>
  );
}

export default SpotifyPlayer;
