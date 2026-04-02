import { getRecommendationsForUser } from "../services/recommendationService.js";

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