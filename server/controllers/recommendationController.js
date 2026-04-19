import {
  getRecommendationsForUser,
  invalidateUserCache,
} from "../services/recommendationService.js";

/**
 * GET /api/recommendations?genre=pop
 * Returns up to 20 scored, artist-diverse recommendations for the user.
 */
export const getRecommendations = async (req, res) => {
  try {
    const { genre } = req.query;
    const userId    = req.user.uid;

    if (!genre) {
      return res.status(400).json({ error: "genre query param is required" });
    }

    const recommendations = await getRecommendationsForUser(userId, genre);

    // Always return { recommendations: [...] } so the frontend shape is stable
    return res.json({ recommendations });
  } catch (err) {
    console.error("[recommendationController] getRecommendations:", err.message);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

/**
 * POST /api/recommendations/invalidate
 * Explicit cache bust — called by the frontend when it needs a forced refresh.
 * The primary invalidation path is trackController calling invalidateUserCache
 * directly after every interaction event.
 */
export const invalidateRecommendations = async (req, res) => {
  try {
    invalidateUserCache(req.user.uid);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[recommendationController] invalidate:", err.message);
    return res.status(500).json({ error: "Failed to invalidate cache" });
  }
};