import { useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../config/firebase";
import { normalizeTrack } from "../utils/normalizeTrack";

export function useSpotifySearch() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const lastFetch = useRef(0);


  const searchSpotify = useCallback(async () => {
    if (!search.trim() || loading || !hasMore) return;

    const now = Date.now();
    if (now - lastFetch.current < 500) return;
    lastFetch.current = now;

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;

      const headers = {};
      if (user) {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(search)}&offset=${offset}`,
        { headers, signal: controller.signal }
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      const newTracks = (data.tracks || []).map(normalizeTrack);

      // dedupe tracks
      setResults((prev) => {
        const existing = new Set(prev.map((t) => t.spotifyId));

        return [
          ...prev,
          ...newTracks.filter((t) => !existing.has(t.spotifyId)),
        ];
      });

      // stop infinite scroll when no more results
      if (newTracks.length === 0) {
        setHasMore(false);
      }

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        setError("Search failed");
      }
    } finally {
      setLoading(false);
    }
  }, [search, offset, loading, hasMore]);

  // RESET when search changes
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
  }, [search]);

  // DEBOUNCE
  useEffect(() => {
    if (search.length > 2) {
      const t = setTimeout(searchSpotify, 400);
      return () => clearTimeout(t);
    }
  }, [search, searchSpotify]);

  // infnite scroll
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        !loading &&
        hasMore
      ) {
        setOffset((o) => o + 20);
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore]);

  return {
    search,
    setSearch,
    results,
    loading,
    error,
  };
}