// Dashboard.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
import { auth, db } from "../config/firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore.js";
import { getRecommendationsForUser } from "../services/recommendationService.js";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  const controllerRef = useRef(null);
  const lastFetchTime = useRef(0);

  // Fetch playlists safely
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "playlists"),
          where("ownerId", "==", user.uid)
        );

        const snap = await getDocs(q);
        setPlaylists(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Playlist error:", err);
      }
    };

    fetchPlaylists();
  }, []);

  // --- SEARCH FUNCTION ---
  const searchSpotify = useCallback(async () => {
    if (!search.trim() || loading || !hasMore) return;

    // Rate limit: 1 request/sec
    const now = Date.now();
    if (now - lastFetchTime.current < 1000) return;
    lastFetchTime.current = now;

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

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
        {
          headers,
          signal: controller.signal,
        }
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      if (!data?.tracks?.length) {
        setHasMore(false);
        return;
      }

      setResults((prev) => {
        const existing = new Set(prev.map((t) => t.spotifyId));
        const filtered = data.tracks.filter((t) => !existing.has(t.spotifyId));
        return [...prev, ...filtered];
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        setError("Failed to load tracks.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, offset, loading, hasMore]);

  // Reset on search
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
  }, [search]);

  // Controlled scroll
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
      if (search.length > 2) searchSpotify();
    }, 500);

    return () => clearTimeout(delay);
  }, [search, searchSpotify]);

  //LIVE HYBRID RECOMMENDATIONS
  const fetchRecommendations = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Example: genre could be dynamic based on user taste
      const genre = "pop";
      const recs = await getRecommendationsForUser(user.uid, genre);

      setResults((prev) => {
        const existing = new Set(prev.map((t) => t.spotifyId));
        const filtered = recs.filter((t) => !existing.has(t.spotifyId));
        return [...prev, ...filtered];
      });
    } catch (err) {
      console.error("Recommendations error:", err);
    }
  }, []);

  // Initial fetch and subscribe to live updates
  useEffect(() => {
    fetchRecommendations();

    const handler = () => fetchRecommendations();
    window.addEventListener("recommendationUpdate", handler);
    return () => window.removeEventListener("recommendationUpdate", handler);
  }, [fetchRecommendations]);

  return (
    <div className="dashboard">
      <input
        type="search"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p>{error}</p>}

      <div className="track-grid">
        {results.map((track) => (
          <TrackSearchResult
            key={track.spotifyId}
            track={track}
            playlists={playlists}
          />
        ))}
      </div>

      {loading &&
        Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="track-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-text">
              <div className="skeleton-line short" />
              <div className="skeleton-line long" />
            </div>
          </div>
        ))}
    </div>
  );
}

export default Dashboard;
