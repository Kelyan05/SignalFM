import React from "react";
import { useEffect, useState } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";

function Recommendations() {
  const [accessToken, setAccessToken] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [energy, setEnergy] = useState(0.7);
  const [valence, setValence] = useState(0.6);
  const [popularity, setPopularity] = useState(50);
  const [loading, setLoading] = useState(false);
  const allowedGenres = ["pop", "rock", "hip-hop", "jazz", "electronic"];

  // Fetch a new token from your server
  const fetchToken = async () => {
    try {
      const res = await fetch("http://localhost:3001/spotify-token");
      if (!res.ok) {
        console.error("Failed to fetch token:", res.status);
        return;
      }
      const data = await res.json();
      setAccessToken(data.accessToken);
    } catch (err) {
      console.error("Error fetching token:", err);
    }
  };

  // Fetch recommendations using a genre seed
  const fetchRecommendations = async () => {
    if (!accessToken || allowedGenres.length === 0) return;

    setLoading(true);

    const seedGenres = allowedGenres.slice(0, 2);

    // build a genre query like: genre:pop OR genre:rock
    const genreQuery = seedGenres.map((g) => `genre:${g}`).join(" OR ");

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      genreQuery
    )}&type=track&limit=50`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        console.error("Search error:", res.status, await res.text());
        setLoading(false);
        return;
      }

      const data = await res.json();

      // client-side filtering instead of Spotify recommendations
      const filtered = data.tracks.items
        .filter((track) => track.popularity >= popularity)
        .slice(0, 40);

      setRecommendations(
        filtered.map((track) => ({
          id: track.id,
          title: track.name,
          artist: track.artists?.[0]?.name ?? "Unknown Artist",
          albumUrl: track.album?.images?.[0]?.url ?? null,
        }))
      );
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  // Re-fetch when popularity changes
  useEffect(() => {
    if (accessToken) {
      fetchRecommendations();
    }
  }, [accessToken, popularity]);

  return (
    <div className="filters">
      <label>
        Energy
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
        />
      </label>

      <label>
        Mood
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={valence}
          onChange={(e) => setValence(Number(e.target.value))}
        />
      </label>

      <label>
        Popularity
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={popularity}
          onChange={(e) => setPopularity(Number(e.target.value))}
        />
      </label>
      <div>
        <h3>Recommended for you</h3>

        <div className="track-grid">
          {loading && <p>Loading recommendations...</p>}

          {!loading && recommendations.length === 0 && (
            <p>No recommendations found. Try adjusting filters.</p>
          )}

          {!loading &&
            recommendations.map((track) => (
              <TrackSearchResult key={track.id} track={track} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;
