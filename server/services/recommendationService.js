import { getSpotifyRecommendations } from "./spotifyService.js";
import { getTrackFeatures } from "./featureService.js";
import { getUserTaste } from "./userService.js";
import { getEngagementData } from "./engagementService.js";
import { getCache, setCache } from "./cacheService.js";

const CACHE_TTL = 60 * 10; // 10 min

export const getRecommendationsForUser = async (userId, genre) => {
  const cacheKey = `rec:${userId}:${genre}`;

  // CACHE HIT
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // Get tracks from Spotify (genre-based)
  const tracks = await getSpotifyRecommendations(genre, 50);

  // Get audio features (embeddings)
  const featuresMap = await getTrackFeatures(tracks.map(t => t.id));

  // Get user taste
  const userTaste = await getUserTaste(userId);

  // Get engagement
  const engagement = await getEngagementData(tracks.map(t => t.id));

  // Score tracks
  const scored = tracks.map(track => {
    const features = featuresMap[track.id];
    const engage = engagement[track.id] || {};

    const score = calculateScore(track, features, userTaste, engage);

    return { ...track, score };
  });

  // sort + diversify
  const sorted = scored.sort((a, b) => b.score - a.score);

  const uniqueArtists = new Set();
  const diversified = sorted.filter(t => {
    if (uniqueArtists.has(t.artist)) return false;
    uniqueArtists.add(t.artist);
    return true;
  });

  const final = diversified.slice(0, 50);

  const similarity = (user, track) => {
    if (!track) return 0;
  
    return (
      1 -
      (
        Math.abs(user.energy - track.energy) +
        Math.abs(user.danceability - track.danceability) +
        Math.abs(user.valence - track.valence)
      ) / 3
    );
  };
  
  const calculateScore = (track, features, userTaste, engagement) => {
    const embedScore = similarity(userTaste, features);
  
    const popularityScore = track.popularity / 100;
  
    const engagementScore =
      (engagement.likes || 0) * 0.4 +
      (engagement.plays || 0) * 0.2 -
      (engagement.skips || 0) * 0.3;
  
    return (
      embedScore * 0.4 +
      popularityScore * 0.2 +
      engagementScore * 0.4
    );
  };

  // Cache result
  await setCache(cacheKey, final, CACHE_TTL);

  return final;
};