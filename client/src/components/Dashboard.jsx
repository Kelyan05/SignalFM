import { useState, useEffect } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

function Dashboard() {
  const [accessToken, setAccessToken] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

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
        )}&type=track&limit=50&offset=${offset}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        console.error("Spotify search error:", res.status, await res.text());
        return;
      }

      const data = await res.json();
      if (!data.tracks) return;

      setSearchResults((prev) => [
        ...prev,
        ...data.tracks.items.map((track) => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || "Unknown Artist",
          albumUrl: track.album.images[0]?.url || null,
        })),
      ]);
    } catch (err) {
      console.error("Error searching Spotify:", err);
    }
  };

  // Reset search results when `search` changes
  useEffect(() => {
    setSearchResults([]);
    setOffset(0);
  }, [search]);

  // Get token once on mount
  useEffect(() => {
    fetchToken();
  }, []);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        !loading
      ) {
        setOffset((prev) => prev + 50);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]);

  // Trigger search whenever `search` or `accessToken` changes
  useEffect(() => {
    if (search && accessToken) {
      searchSpotify();
    }
  }, [search, accessToken, offset]);

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
      {search ? (
        <div className="track-grid">
          {searchResults.map((track) => (
            <TrackSearchResult key={track.id} track={track} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default Dashboard;
