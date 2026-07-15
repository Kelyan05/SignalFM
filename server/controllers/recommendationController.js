import {
  getRecommendationsForUser,
  invalidateUserCache,
} from "../services/recommendationService.js";


export const getRecommendations = async (req, res) => {
  try {
    const { genre } = req.query;
    const userId    = req.user.uid;

    if (!genre) {
      return res.status(400).json({ error: "genre query param is required" });
    }

    // The client's refresh button sends ?refresh=true; honour it by skipping
    // the cache (previously this param was silently ignored).
    const bypassCache = req.query.refresh === "true";

    const recommendations = await getRecommendationsForUser(userId, genre, { bypassCache });

    // Always return { recommendations: [...] } so the frontend shape is stable
    return res.json({ recommendations });
  } catch (err) {
    console.error("[recommendationController] getRecommendations:", err.message);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};


export const invalidateRecommendations = async (req, res) => {
  try {
    invalidateUserCache(req.user.uid);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[recommendationController] invalidate:", err.message);
    return res.status(500).json({ error: "Failed to invalidate cache" });
  }
};