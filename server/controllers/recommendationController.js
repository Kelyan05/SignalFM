import { getRecommendationsForUser, invalidateUserCache } from "../services/recommendationService.js";

export const getRecommendations = async (req, res) => {
  try {
    const { genre } = req.query;
    const userId = req.user.uid;

    if (!genre) {
      return res.status(400).json({ error: "Genre required" });
    }

    const recommendations = await getRecommendationsForUser(userId, genre);
    res.json({ recommendations });
  } catch (err) {
    console.error("Recommendation error:", err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

// POST /api/recommendations/invalidate
// Secondary invalidation endpoint — the primary path is trackController
// calling invalidateUserCache directly after every interaction.
// This endpoint exists as a fallback for the frontend to call explicitly
// if it needs to force a refresh (e.g. after a batch interaction).
export const invalidateRecommendations = async (req, res) => {
  try {
    invalidateUserCache(req.user.uid);
    res.json({ ok: true });
  } catch (err) {
    console.error("Cache invalidation error:", err.message);
    res.status(500).json({ error: "Failed to invalidate cache" });
  }
};