import { useEffect, useState } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import "../css/Dashboard.css";

function Recommendations() {
  const [artistRecs, setArtistRecs] = useState([]);
  const [genreRecs, setGenreRecs] = useState([]);
  const [popularity, setPopularity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const user = auth.currentUser;

      if (!user) return;

      const q = query(
        collection(db, "playlists"),
        where("ownerId", "==", user.uid)
      );

      const snap = await getDocs(q);

      setPlaylists(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    };

    fetchPlaylists();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setError("Login to see personalized recommendations.");
        return;
      }

      setLoading(true);
      setError(null);

      const idToken = await user.getIdToken();

      const genre = "pop";

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations?genre=${genre}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch recommendations");

      const data = await res.json();

      setArtistRecs(data.artistTracks || []);
      setGenreRecs(data.genreTracks || []);
    } catch (err) {
      console.error("Recommendation error:", err);
      setError("Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filteredArtist = artistRecs.filter(
    (track) => track.popularity >= popularity
  );

  const filteredGenre = genreRecs.filter(
    (track) => track.popularity >= popularity
  );

  return (
    <div className="recommendations-container">
      <div className="filter-bar">
        <label>
          Minimum Popularity: <strong>{popularity}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={popularity}
          onChange={(e) => setPopularity(Number(e.target.value))}
        />
      </div>

      <h3>Recommended For You 🎧</h3>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="skeleton-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      )}

      {!loading &&
        !error &&
        filteredArtist.length === 0 &&
        filteredGenre.length === 0 && (
          <p className="empty-text">
            No recommendations match your filter. Try lowering popularity.
          </p>
        )}

      {filteredArtist.length > 0 && (
        <>
          <h4>Based on Your Favorite Artists</h4>
          <div className="track-grid">
            {filteredArtist.map((track) => (
              <TrackSearchResult
                key={track.id}
                track={track}
                playlists={playlists}
              />
            ))}
          </div>
        </>
      )}

      {filteredGenre.length > 0 && (
        <>
          <h4>Based on Your Favorite Genres</h4>
          <div className="track-grid">
            {filteredGenre.map((track) => (
              <TrackSearchResult
                key={track.id}
                track={track}
                playlists={playlists}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Recommendations;
