import { useState, useEffect } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

function Dashboard() {
  const [accessToken, setAccessToken] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [energy, setEnergy] = useState(0.7);
  const [valence, setValence] = useState(0.6);
  const [popularity, setPopularity] = useState(50);

  // Hardcoded genres allowed with Client Credentials
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
        return;
      }

      const data = await res.json();

      // client-side filtering instead of Spotify recommendations
      const filtered = data.tracks.items
        .filter((track) => track.popularity >= popularity)
        .slice(0, 20);

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
    }
  };

  useEffect(() => {
    if (accessToken) fetchRecommendations();
  }, [accessToken, energy, valence, popularity]);

  // Search Spotify
  const searchSpotify = async () => {
    if (!search || !accessToken) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          search
        )}&type=track&limit=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        console.error("Spotify search error:", res.status, await res.text());
        return;
      }

      const data = await res.json();
      if (!data.tracks) return;

      setSearchResults(
        data.tracks.items.map((track) => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || "Unknown Artist",
          albumUrl: track.album.images[0]?.url || null,
        }))
      );
    } catch (err) {
      console.error("Error searching Spotify:", err);
    }
  };

  // Get token once on mount
  useEffect(() => {
    fetchToken();
  }, []);

  // Trigger search whenever `search` or `accessToken` changes
  useEffect(() => {
    searchSpotify();
  }, [search, accessToken]);

  return (
    <div className="dashboard">
      <div className="search-container">
        <input
          className="search-input"
          type="search"
          placeholder="Search songs or artists"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
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
      </div>
      {search ? (
        <div className="track-grid">
          {searchResults.map((track) => (
            <TrackSearchResult key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div>
          <h3>Recommended for you</h3>
          <div className="track-grid">
            {recommendations.map((track) => (
              <TrackSearchResult key={track.id} track={track} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
