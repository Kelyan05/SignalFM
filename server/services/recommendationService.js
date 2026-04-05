import { searchTracks, getCachedRecommendations } from "./spotifyService.js";
import { getTrackFeatures } from "./featureService.js";
import { getUserTaste } from "./userService.js";
import { getEngagementData } from "./engagementService.js";

const CACHE_TTL = 10 * 60 * 1000; // 10 min

// Calculate similarity between user taste and track features
const similarity = (user, track) => {
  if (!track) return 0;
  return (
    1 -
    (Math.abs(user.energy - track.energy) +
      Math.abs(user.danceability - track.danceability) +
      Math.abs(user.valence - track.valence)) /
      3
  );
};

// Score a track using embeddings, popularity, engagement
const calculateScore = (track, features, userTaste, engagement) => {
  const embedScore = similarity(userTaste, features);
  const popularityScore = track.popularity / 100;
  const engagementScore =
    (engagement.likes || 0) * 0.4 +
    (engagement.plays || 0) * 0.2 -
    (engagement.skips || 0) * 0.3;

  return embedScore * 0.4 + popularityScore * 0.2 + engagementScore * 0.4;
};

// Main recommendation function
export const getRecommendationsForUser = async (userId, genre) => {
  // Use unified cache
  return await getCachedRecommendations(userId, genre, async () => {
    // Step 1: Fetch genre-based tracks
    const tracks = await searchTracks(genre, 0); // 0 offset for simplicity

    // Step 2: Get embeddings/audio features
    const featuresMap = await getTrackFeatures(tracks.map((t) => t.spotifyId));

    // Step 3: Get user taste profile
    const userTaste = await getUserTaste(userId);

    // Step 4: Get engagement stats
    const engagement = await getEngagementData(tracks.map((t) => t.spotifyId));

    // Step 5: Score each track
    const scored = tracks.map((track) => ({
      ...track,
      score: calculateScore(track, featuresMap[track.spotifyId], userTaste, engagement[track.spotifyId] || {}),
    }));

    // Step 6: Sort & diversify by artist
    const sorted = scored.sort((a, b) => b.score - a.score);
    const uniqueArtists = new Set();
    const diversified = sorted.filter((t) => {
      if (uniqueArtists.has(t.artist)) return false;
      uniqueArtists.add(t.artist);
      return true;
    });

    // Step 7: Limit to top 50
    return diversified.slice(0, 50);
  });
};