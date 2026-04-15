import { searchTracks } from "./spotifyService.js";
import { getEngagementData } from "./engagementService.js";
import { getCollaborativeScore } from "./collaborativeService.js";
import { db } from "../config/firebaseAdmin.js";

// ─── Recommendation cache 
//
// Single authoritative cache owned here — spotifyService.getCachedRecommendations
// is NOT used so that invalidateUserCache actually works.
// The Spotify search cache in spotifyService is still used for raw track fetching,
// which is fine — we want to avoid hammering the Spotify API for the same search.
// What we don't want cached is the *scoring* step, which depends on engagement data
// that changes when the user interacts. Busting this cache re-runs scoring with
// fresh engagement even when the underlying track list comes from Spotify's cache.

const recommendationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes passive browsing

export const invalidateUserCache = (userId) => {
  for (const key of recommendationCache.keys()) {
    if (key.startsWith(`${userId}-`)) recommendationCache.delete(key);
  }
};

// ─── Scoring helpers 

// Popularity: Spotify's 0–100 value normalised to 0–1.
const getPopularityScore = (track) => (track.popularity || 0) / 100;

// Engagement: platform interaction data from Firestore.
// Log compression prevents high-volume tracks dominating low-volume ones.
// +1 guards against log(0).
const getEngagementScore = (engagement) => {
  if (!engagement) return 0;
  const likes = Math.log((engagement.likes || 0) + 1);
  const plays  = Math.log((engagement.plays  || 0) + 1);
  const skips  = Math.log((engagement.skips  || 0) + 1);
  return likes * 0.5 + plays * 0.3 - skips * 0.2;
};

// Recency: 1.0 for current year, linear decay to 0 at 3 years, floored at 0.
const getRecencyScore = (track) => {
  if (!track.release_date) return 0;
  const age = new Date().getFullYear() - new Date(track.release_date).getFullYear();
  return Math.max(0, 1 - age / 3);
};

// Final score weights — sum to 1.0:
//   Popularity  0.4  proven audience signal
//   Engagement  0.3  our platform's community signal
//   Recency     0.2  freshness / genre-coherence proxy
//   Collaborative 0.1  user-similarity signal (item-based CF)
const calculateFinalScore = (pop, eng, rec, collab) =>
  pop * 0.4 + eng * 0.3 + rec * 0.2 + collab * 0.1;

// One track per artist — already sorted, so first occurrence is best score.
const diversifyByArtist = (tracks) => {
  const seen = new Set();
  return tracks.filter(({ artist }) => {
    if (seen.has(artist)) return false;
    seen.add(artist);
    return true;
  });
};


export const getRecommendationsForUser = async (userId, genre) => {
  const cacheKey = `${userId}-${genre}`;
  const cached = recommendationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Random offset so repeated requests explore different catalogue slices.
  const offset = Math.floor(Math.random() * 10) * 20;
  const tracks = await searchTracks(genre, offset);

  // Fetch per-track engagement stats and all engagement docs for CF in parallel.
  const [engagementMap, allEngagementsSnap] = await Promise.all([
    getEngagementData(tracks.map((t) => t.spotifyId)),
    db.collection("engagement").get(),
  ]);

  // Flatten Firestore engagement collection for the collaborative filter.
  // Each document is keyed by trackId and contains { likes, plays, skips }.
  // collaborativeService expects { trackId, userId, liked } — we approximate
  // "liked" from the aggregated likes count (> 0 means at least one user liked it).
  // This is a platform-level signal rather than per-user CF; it still surfaces
  // tracks that the community responds well to alongside the current track.
  const allEngagements = allEngagementsSnap.docs.map((doc) => ({
    trackId: doc.id,
    userId: "platform", // aggregated — no per-user breakdown stored yet
    liked: (doc.data().likes || 0) > 0,
  }));

  const scoredTracks = tracks.map((track) => {
    const popularityScore    = getPopularityScore(track);
    const engagementScore    = getEngagementScore(engagementMap[track.spotifyId]);
    const recencyScore       = getRecencyScore(track);
    const collaborativeScore = getCollaborativeScore(track.spotifyId, userId, allEngagements);

    return {
      ...track,
      score: calculateFinalScore(
        popularityScore,
        engagementScore,
        recencyScore,
        collaborativeScore
      ),
      _scores: { popularityScore, engagementScore, recencyScore, collaborativeScore },
    };
  });

  const results = diversifyByArtist(
    scoredTracks.sort((a, b) => b.score - a.score)
  ).slice(0, 20);

  recommendationCache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
};