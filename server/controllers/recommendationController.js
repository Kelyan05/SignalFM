import { searchTracks, getCachedRecommendations } from "../services/spotifyService.js";
import { db } from "../config/firebaseAdmin.js";
import { calculateScore } from "../services/recommendationService.js";

export const getRecommendations = async (req, res) => {
  try {
    const { genre } = req.query;
    const userId = req.user.uid;

    if (!genre) return res.status(400).json({ error: "Genre required" });

    const recommendations = await getCachedRecommendations(userId, genre, async () => {
      // Fetch top 50 tracks for genre
      const genreTracks = await searchTracks(genre, 0);

      // Fetch user profile
      const userDoc = await db.collection("users").doc(userId).get();
      const userProfile = userDoc.exists ? userDoc.data() : { preferredGenres: [], likedTracks: [] };

      // Fetch engagement data
      const engagementDocs = await db.collection("engagement").get();
      const engagementData = {};
      engagementDocs.forEach(doc => { engagementData[doc.id] = doc.data(); });

      // Calculate score per track
      const scoredTracks = genreTracks.map(track => {
        const score = calculateScore(track, userProfile, engagementData);
        return { ...track, score };
      });

      // Sort and pick top 20
      return scoredTracks.sort((a, b) => b.score - a.score).slice(0, 20);
    });

    res.json({ recommendations });
  } catch (error) {
    console.error("Recommendation Controller Error:", error.message);
    res.status(500).json({ error: "Recommendation error" });
  }
};