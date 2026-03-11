import axios from "axios";
import { getSpotifyToken } from "../config/spotify.js";

// Unified cache for search and recommendations with TTL
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Utility function to generate cache key
const generateCacheKey = (prefix, params) => {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map(k => `${k}=${params[k]}`).join("&");
  return `${prefix}-${paramString}`;
};

// Search tracks (supports offset caching)
export const searchTracks = async (query, offset = 0) => {
  const cacheKey = generateCacheKey("search", { query, offset });

  const now = Date.now();
  const cached = cache[cacheKey];
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit:", cacheKey);
    return cached.data;
  }

  try {
    const token = await getSpotifyToken();

    const res = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: "track", limit: 20, offset },
    });

    const tracks = res.data.tracks.items.map((track) => ({
      spotifyId: track.id,
      title: track.name,
      artist: track.artists[0]?.name || "Unknown",
      albumUrl: track.album.images[0]?.url || null,
      explicit: track.explicit,
      popularity: track.popularity ?? 0,
      release_date: track.album?.release_date || "",
    }));

    cache[cacheKey] = { data: tracks, timestamp: now };
    return tracks;
  } catch (error) {
    console.error("Spotify Service Error:", error.message);
    return [];
  }
};

// Cache recommendations per user and genre
export const getCachedRecommendations = async (userId, genre, fetchFn) => {
  const cacheKey = generateCacheKey("recommendation", { userId, genre });

  const now = Date.now();
  const cached = cache[cacheKey];
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log("Recommendations cache hit:", cacheKey);
    return cached.data;
  }

  // Call provided fetch function to generate recommendations
  const recommendations = await fetchFn();

  cache[cacheKey] = { data: recommendations, timestamp: now };
  return recommendations;
};