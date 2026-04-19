/**
 * collaborativeService.js
 *
 * Lightweight item-based collaborative filtering.
 *
 * Logic:
 *   1. Find all users who liked the target track.
 *   2. Find all other tracks those users also liked.
 *   3. Normalise the co-like count to [0, 1].
 *
 * The returned score is used as a 0.1-weighted input in recommendationService.
 */
export const getCollaborativeScore = (trackId, userId, allEngagements) => {
  // Step 1: collect users who liked this track
  const usersWhoLiked = new Set();
  allEngagements.forEach((e) => {
    if (e.trackId === trackId && e.liked) {
      usersWhoLiked.add(e.userId);
    }
  });

  if (usersWhoLiked.size === 0) return 0;

  // Step 2: count co-liked tracks
  const trackCounts = {};
  allEngagements.forEach((e) => {
    if (usersWhoLiked.has(e.userId) && e.liked) {
      trackCounts[e.trackId] = (trackCounts[e.trackId] || 0) + 1;
    }
  });

  // Step 3: normalise — guard against empty object with fallback of 1
  const counts   = Object.values(trackCounts);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

  return (trackCounts[trackId] || 0) / maxCount;
};