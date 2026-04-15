import { useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../config/firebase";

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

    try {
      const user = auth.currentUser;

      const headers = {};
      if (user) {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search?q=${search}&offset=${offset}`,
        { headers, signal: controller.signal }
      );

      const data = await res.json();

      setResults(prev => [...prev, ...(data.tracks || [])]);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Search failed");
      }
    } finally {
      setLoading(false);
    }
  }, [search, offset, loading, hasMore]);

  useEffect(() => {
    if (search.length > 2) {
      const t = setTimeout(searchSpotify, 400);
      return () => clearTimeout(t);
    }
  }, [search, searchSpotify]);

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setOffset(o => o + 20);
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return {
    search,
    setSearch,
    results,
    loading,
    error,
  };
}