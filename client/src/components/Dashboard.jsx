import { useState, useEffect } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

function Dashboard() {
  const [accessToken, setAccessToken] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch Spotify token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(
          "https://signalfm-api.onrender.com/spotify-token"
        );
        const data = await res.json();
        setAccessToken(data.accessToken);
      } catch (err) {
        console.error("Token error:", err);
      }
    };
    fetchToken();
  }, []);

  // Search Spotify
  const searchSpotify = async () => {
    if (!search || !accessToken || loading || !hasMore) return;

    setLoading(true);

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          search
        )}&type=track&limit=50&offset=${offset}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = await res.json();
      if (!data.tracks || data.tracks.items.length === 0) {
        setHasMore(false);
        return;
      }

      setResults((prev) => {
        const existing = new Set(prev.map((t) => t.spotifyId)); // use spotifyId for uniqueness

        const newTracks = data.tracks.items
          .map((track) => ({
            spotifyId: track.id, // <-- add this for Firestore
            id: `${track.id}`, // stable React key
            title: track.name,
            artist: track.artists[0]?.name || "Unknown Artist",
            albumUrl: track.album.images[0]?.url || null,
            explicit: track.explicit ?? false,
          }))
          .filter((track) => {
            if (existing.has(track.spotifyId)) return false;
            existing.add(track.spotifyId);
            return true;
          });

        return [...prev, ...newTracks];
      });

      if (data.tracks.items.length < 50) setHasMore(false);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset on new search
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
  }, [search]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setOffset((prev) => prev + 50);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch when offset/search changes
  useEffect(() => {
    searchSpotify();
  }, [offset, search, accessToken]);

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

      <div className="track-grid">
        {results.map((track) => (
          <TrackSearchResult key={track.id} track={track} />
        ))}
      </div>

      {loading && <p className="loading-text">Loading more tracks...</p>}
    </div>
  );
}

export default Dashboard;
