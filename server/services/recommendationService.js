import { searchTracks }      from "./spotifyService.js";
import { getUserEngagement } from "./engagementService.js";
import { scoreTrack, diversifyByArtist } from "./scoring.js";

const MAX_RESULTS = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation cache
// Keyed by "userId-genre" so each user+genre pair is cached independently.
// Invalidated whenever the user records a track event (see trackController),
// so scoring always reflects their latest interactions. In-memory, which is
// fine for a single server instance; multiple instances would need a shared
// store like Redis (a known limitation — see ARCHITECTURE.md).
// ─────────────────────────────────────────────────────────────────────────────
const recommendationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateUserCache = (userId) => {
  for (const key of recommendationCache.keys()) {
    if (key.startsWith(`${userId}-`)) {
      recommendationCache.delete(key);
    }
  }
};

/**
 * Recommend up to MAX_RESULTS tracks in a genre, personalised to one user.
 *
 * Pipeline:
 *   1. Candidate generation: Spotify search for the genre, from a random
 *      catalogue offset so repeat visits explore different slices.
 *   2. Fetch this user's engagement for exactly those candidate IDs
 *      (one batched read — see engagementService).
 *   3. Score every candidate with the transparent weighted sum in scoring.js.
 *   4. Sort, enforce one-track-per-artist, cap at MAX_RESULTS.
 */
export const getRecommendationsForUser = async (userId, genre, { bypassCache = false } = {}) => {
  const cacheKey = `${userId}-${genre}`;

  if (!bypassCache) {
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const offset = Math.floor(Math.random() * 10) * 20;
  const candidates = await searchTracks(genre, offset);

  const engagementMap = await getUserEngagement(
    userId,
    candidates.map((t) => t.spotifyId)
  );

  const scored = candidates.map((track) => ({
    ...track,
    score: scoreTrack(track, engagementMap[track.spotifyId]),
  }));

  const results = diversifyByArtist(
    scored.sort((a, b) => b.score - a.score)
  ).slice(0, MAX_RESULTS);

  recommendationCache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
};
