import { useState, useEffect } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }

    fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        search
      )}&type=track&limit=30`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SPOTIFY_TOKEN}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.tracks) return;

        setSearchResults(
          data.tracks.items.map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artists[0].name,
            albumUrl: track.album.images[0]?.url,
          }))
        );
      })
      .catch((error) => console.error(error));
  }, [search]);

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
        {searchResults.map((track) => (
          <TrackSearchResult key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
