import { searchTracks }       from "./spotifyService.js";
import { getEngagementData }  from "./engagementService.js";
import { getCollaborativeScore } from "./collaborativeService.js";
import { db }                 from "../config/firebaseAdmin.js";

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation cache
// Keyed by "userId-genre" so each user+genre pair is cached independently.
// Invalidated on every track event so scoring always reflects the latest data.
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

// ─────────────────────────────────────────────────────────────────────────────
// Scoring helpers — each returns a value in [0, 1]
// ─────────────────────────────────────────────────────────────────────────────

// Popularity: Spotify's 0–100 popularity value, normalised to 0–1.
const getPopularityScore = (track) => (track.popularity || 0) / 100;

// Engagement: platform interaction data from Firestore.
// Log compression prevents a single high-volume track from dominating.
// +1 guards against log(0).
const getEngagementScore = (engagement) => {
  if (!engagement) return 0;
  const likes = Math.log((engagement.likes || 0) + 1);
  const plays = Math.log((engagement.plays || 0) + 1);
  const skips = Math.log((engagement.skips || 0) + 1);
  return likes * 0.5 + plays * 0.3 - skips * 0.2;
};

// Recency: 1.0 for current year, linear decay to 0 over 3 years.
const getRecencyScore = (track) => {
  if (!track.release_date) return 0;
  const age = new Date().getFullYear() - new Date(track.release_date).getFullYear();
  return Math.max(0, 1 - age / 3);
};

// Final weighted score — weights sum to 1.0:
//   0.4 popularity  – proven audience signal
//   0.3 engagement  – platform community signal
//   0.2 recency     – freshness
//   0.1 collaborative – item-based CF signal
const calculateFinalScore = (pop, eng, rec, collab) =>
  pop * 0.4 + eng * 0.3 + rec * 0.2 + collab * 0.1;

// One track per artist (already sorted, so first occurrence = highest score).
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
  const cached   = recommendationCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Random offset so repeated requests explore different catalogue slices
  const offset = Math.floor(Math.random() * 10) * 20;
  const tracks = await searchTracks(genre, offset);

  // Fetch per-track engagement + all engagement docs for Collaborative Filtering in parallel
  const [engagementMap, allEngagementsSnap] = await Promise.all([
    getEngagementData(tracks.map((t) => t.spotifyId)),
    db.collection("engagement").get(),
  ]);

  // Flatten Firestore docs into the shape collaborativeService expects
  const allEngagements = allEngagementsSnap.docs.map((doc) => ({
    trackId: doc.id,
    userId:  "platform", // aggregated signal — no per-user breakdown yet
    liked:   (doc.data().likes || 0) > 0,
  }));

  // Score every track across the four dimensions
  const scoredTracks = tracks.map((track) => {
    const popularityScore    = getPopularityScore(track);
    const engagementScore    = getEngagementScore(engagementMap[track.spotifyId]);
    const recencyScore       = getRecencyScore(track);
    const collaborativeScore = getCollaborativeScore(track.spotifyId, userId, allEngagements);

    return {
      ...track,
      score: calculateFinalScore(popularityScore, engagementScore, recencyScore, collaborativeScore),
    };
  });

  // Sort, diversify by artist, cap at 20 results
  const results = diversifyByArtist(
    scoredTracks.sort((a, b) => b.score - a.score)
  ).slice(0, 20);

  recommendationCache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
};