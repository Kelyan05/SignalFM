import { useState, useEffect, useCallback, useRef } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
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

  const controllerRef = useRef(null);
  const lastFetchTime = useRef(0);

  //Fetch playlists safely
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

  //SEARCH FUNCTION
  const searchSpotify = useCallback(async () => {
    if (!search.trim() || loading || !hasMore) return;

    // 🔒 rate limit (1 request/sec)
    const now = Date.now();
    if (now - lastFetchTime.current < 1000) return;
    lastFetchTime.current = now;

    // cancel previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

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

  //reset on search
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
  }, [search]);

  //controlled scroll
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

  //debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.length > 2) searchSpotify();
    }, 500);

    return () => clearTimeout(delay);
  }, [search, searchSpotify]);

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

      {loading && <p>Loading...</p>}
    </div>
  );
}

export default Dashboard;
