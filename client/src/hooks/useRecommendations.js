import { useState, useEffect, useCallback } from "react";
import { auth } from "../config/firebase";

const API = import.meta.env.VITE_API_URL;


export function useRecommendations(genre) {
  const [tracks, setTracks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      const user = auth.currentUser;
      if (!user || !genre) return;

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const url   = `${API}/api/recommendations?genre=${genre}${forceRefresh ? "&refresh=true" : ""}`;

        const res  = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Backend returns { recommendations: [...] }
        const { recommendations } = await res.json();
        setTracks(recommendations ?? []);
      } catch (err) {
        console.error("[useRecommendations]", err.message);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    },
    [genre]
  );

  // Fetch on mount and whenever genre changes
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    tracks,
    loading,
    error,
    refresh: () => fetchRecommendations(true),
  };
}