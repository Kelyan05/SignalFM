import { useState, useEffect } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import { auth } from "../config/firebase";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

function Recommendations() {
  const [tracks, setTracks] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("pop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const genres = ["pop", "rap", "afro", "jazz", "country", "rock"];

  useEffect(() => {
    fetchRecommendations(selectedGenre);
  }, [selectedGenre]);

  const fetchRecommendations = async (genre) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Please log in to see recommendations.");
        return;
      }

      setLoading(true);
      setError(null);

      const token = await user.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations?genre=${genre}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setTracks(data.recommendations || []);
    } catch (err) {
      console.error(err);
      setError("Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Music Recommendations</h2>

      {/* Genre selector */}
      <div className="genre-buttons">
        {genres.map((genre) => (
          <button
            key={genre}
            className={selectedGenre === genre ? "active" : ""}
            onClick={() => setSelectedGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading && <p>Loading recommendations...</p>}
      {error && <p>{error}</p>}

      <div className="track-grid">
        {tracks.map((track) => (
          <TrackSearchResult
            key={track.spotifyId}
            track={track}
            playlists={[]}
          />
        ))}
      </div>
    </div>
  );
}

export default Recommendations;
