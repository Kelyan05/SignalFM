import { useState, useEffect, useCallback } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  // Fetch user playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "playlists"),
          where("ownerId", "==", user.uid)
        );
        const snap = await getDocs(q);
        setPlaylists(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Playlist fetch error:", err);
      }
    };
    fetchPlaylists();
  }, []);

  // Spotify search
  const searchSpotify = useCallback(async () => {
    if (!search.trim() || loading || !hasMore) return;
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      const headers = {};
      if (user) {
        const token = await user.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(
          search
        )}&offset=${offset}`,
        { headers }
      );

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      if (!data.tracks || data.tracks.length === 0) {
        setHasMore(false);
        return;
      }

      const existing = new Set(results.map((t) => t.spotifyId));
      const newTracks = data.tracks.filter((t) => !existing.has(t.spotifyId));

      setResults((prev) => [...prev, ...newTracks]);
    } catch (err) {
      console.error(err);
      setError("Could not load tracks.");
    } finally {
      setLoading(false);
    }
  }, [search, offset, loading, hasMore, results]);

  // Reset results on new search
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
  }, [search]);

  // Load more on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        !loading &&
        hasMore
      ) {
        setOffset((prev) => prev + 20);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  // Debounce search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.trim()) searchSpotify();
    }, 400);
    return () => clearTimeout(delay);
  }, [search, searchSpotify]);

  return (
    <div className="dashboard">
      <div className="search-container">
        <input
          className="search-input"
          type="search"
          placeholder="Search songs or artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}
      {!loading && results.length === 0 && search && (
        <p className="empty-text">No results found.</p>
      )}

      <div className="track-grid">
        {results.map((track) => (
          <TrackSearchResult
            key={track.spotifyId}
            track={track}
            playlists={playlists}
          />
        ))}
      </div>

      {loading && (
        <div className="skeleton-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
