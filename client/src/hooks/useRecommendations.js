import { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../config/firebase";

export const useRecommendations = (genre = "pop") => {
  // genre cache: { pop: [...], rap: [...] }
  const cacheRef = useRef({});

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(
    async (force = false) => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          return;
        }

        // return cached data instantly 
        if (!force && cacheRef.current[genre]) {
          setTracks(cacheRef.current[genre]);
          return;
        }

        setLoading(true);
        setError(null);

        const token = await user.getIdToken();

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/recommendations?genre=${genre}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch recommendations");

        const data = await res.json();
        const newTracks = data.recommendations || [];

        // overwrite cache 
        cacheRef.current = {
          ...cacheRef.current,
          [genre]: newTracks,
        };

        // update UI
        setTracks(newTracks);
      } catch (err) {
        console.error(err);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    },
    [genre]
  );

  // auto-fetch when genre changes
  useEffect(() => {
    fetchRecommendations(false);
  }, [fetchRecommendations]);

  return {
    tracks,
    loading,
    error,

    // normal refresh = uses cache if available
    refresh: () => fetchRecommendations(false),

    // force refresh = ALWAYS hits backend
    forceRefresh: () => fetchRecommendations(true),
  };
};