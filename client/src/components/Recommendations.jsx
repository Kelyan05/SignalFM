import { useState, useEffect } from "react";
import TrackSearchResult from "../components/TrackSearchResult.jsx";
import { useRecommendations } from "../hooks/useRecommendations";
import { usePlaylists } from "../hooks/usePlaylists";

import {
  FaMusic,
  FaMicrophone,
  FaGlobe,
  FaGuitar,
  FaHatCowboy,
  FaBolt,
  FaRedo,
} from "react-icons/fa";

import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

const GENRES = [
  { id: "pop", label: "Pop", icon: <FaBolt /> },
  { id: "rap", label: "Rap", icon: <FaMicrophone /> },
  { id: "afro", label: "Afro", icon: <FaGlobe /> },
  { id: "jazz", label: "Jazz", icon: <FaMusic /> },
  { id: "country", label: "Country", icon: <FaHatCowboy /> },
  { id: "rock", label: "Rock", icon: <FaGuitar /> },
];

function Recommendations() {
  const [selectedGenre, setSelectedGenre] = useState("pop");
  const { tracks, loading, error, refresh } = useRecommendations(selectedGenre);
  const { playlists, addToPlaylist } = usePlaylists();

  // Listen for cache-bust events fired after likes/skips/plays
  useEffect(() => {
    window.addEventListener("recommendationUpdate", refresh);
    return () => window.removeEventListener("recommendationUpdate", refresh);
  }, [refresh]);

  const activeGenre = GENRES.find((g) => g.id === selectedGenre);

  return (
    <div className="recommendations-section">
      <div className="rec-header">
        <h2 className="rec-title">Recommended for you</h2>
        {!loading && tracks.length > 0 && (
          <span className="rec-count">
            {tracks.length} {activeGenre?.label} picks
          </span>
        )}
      </div>

      <div className="genre-pills">
        {GENRES.map((g) => (
          <button
            key={g.id}
            className={`genre-pill ${selectedGenre === g.id ? "active" : ""}`}
            onClick={() => setSelectedGenre(g.id)}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="track-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-art" />
              <div className="skeleton-line long" />
              <div className="skeleton-line short" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="dashboard-error">{error}</p>}

      {!loading && !error && tracks.length === 0 && (
        <div className="rec-feedback">
          <FaMusic />
          <p>No {selectedGenre} recommendations yet</p>
          <p style={{ fontSize: 13, color: "#555" }}>
            Play, skip or like a track to personalise your feed
          </p>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="track-grid">
          {tracks.map((track) => (
            <TrackSearchResult
              key={track.spotifyId}
              track={track}
              playlists={playlists}
              onAddToPlaylist={addToPlaylist}
            />
          ))}
        </div>
      )}

      {/* Manual refresh — always force-refresh so it works even cold */}
      {!loading && (
        <button className="rec-retry-btn" onClick={refresh}>
          <FaRedo /> Refresh
        </button>
      )}
    </div>
  );
}

export default Recommendations;
