import { useState, useEffect, useCallback, useRef } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import "../css/Dashboard.css";
import { auth, db } from "../config/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

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

  // Fetch user's playlists so TrackSearchResult can show the dropdown
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
        console.error("Playlist fetch error:", err);
      }
    };
    fetchPlaylists();
  }, []);

  // Add a track to a playlist in Firestore and update local state
  const handleAddToPlaylist = useCallback(
    async (playlistId, track) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (!playlist) return;

      const alreadyIn = playlist.tracks?.some(
        (t) => t.spotifyId === track.spotifyId
      );
      if (alreadyIn) return;

      const updatedTracks = [
        ...(playlist.tracks || []),
        {
          spotifyId: track.spotifyId,
          title: track.title,
          artist: track.artist,
          albumUrl: track.albumUrl || track.image || "",
        },
      ];

      try {
        await updateDoc(doc(db, "playlists", playlistId), {
          tracks: updatedTracks,
        });
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId ? { ...p, tracks: updatedTracks } : p
          )
        );
      } catch (err) {
        console.error("Failed to add to playlist:", err);
      }
    },
    [playlists]
  );

  // Search Spotify via backend
  const searchSpotify = useCallback(async () => {
    if (!search.trim() || loading || !hasMore) return;

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
        { headers, signal: controller.signal }
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      if (!data?.tracks?.length) {
        setHasMore(false);
        return;
      }

      setResults((prev) => {
        const existing = new Set(prev.map((t) => t.spotifyId));
        return [
          ...prev,
          ...data.tracks.filter((t) => !existing.has(t.spotifyId)),
        ];
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

  // Reset on new search term
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

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.length > 2) searchSpotify();
    }, 500);
    return () => clearTimeout(delay);
  }, [search, searchSpotify]);

  // Fetches all the recommmended pop songs
  const fetchRecommendations = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations?genre=pop`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      setResults((prev) => {
        const existing = new Set(prev.map((t) => t.spotifyId));
        return [
          ...prev,
          ...(data.recommendations || []).filter(
            (t) => !existing.has(t.spotifyId)
          ),
        ];
      });
    } catch (err) {
      console.error("Recommendations error:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
    const handler = () => fetchRecommendations();
    window.addEventListener("recommendationUpdate", handler);
    return () => window.removeEventListener("recommendationUpdate", handler);
  }, [fetchRecommendations]);

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
            onAddToPlaylist={handleAddToPlaylist}
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
