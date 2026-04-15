import { useEffect, useState } from "react";
import { auth } from "../config/firebase";

export const useRecommendations = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setTracks(data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    const handler = () => fetchRecommendations();
    window.addEventListener("recommendationUpdate", handler);

    return () => window.removeEventListener("recommendationUpdate", handler);
  }, []);

  return { tracks, loading, refresh: fetchRecommendations };
};