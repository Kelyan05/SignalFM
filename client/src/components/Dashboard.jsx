import TrackSearchResult from "../components/TrackSearchResult.jsx";
import "../css/Dashboard.css";
import { useSpotifySearch } from "../hooks/useSpotifySearch";
import { usePlaylists } from "../hooks/usePlaylists";

function Dashboard() {
  const { search, setSearch, results, loading, error } = useSpotifySearch();

  const { playlists, addToPlaylist } = usePlaylists();

  return (
    <div className="dashboard">
      <div className="dashboard-search-wrap">
        <input
          type="search"
          className="dashboard-search"
          placeholder="Search artists, songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="dashboard-error">{error}</p>}
      <div className="track-grid">
        {results.map((track) => (
          <TrackSearchResult
            key={track.spotifyId}
            track={track}
            playlists={playlists}
            onAddToPlaylist={addToPlaylist}
          />
        ))}
      </div>

      {loading && (
        <div className="track-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="skeleton-card">
              <div className="skeleton-art" />
              <div className="skeleton-line long" />
              <div className="skeleton-line short" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
