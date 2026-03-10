import { searchTracks } from "../services/spotifyService.js";
import { db } from "../config/firebaseAdmin.js";
import { calculateScore } from "../services/recommendationService.js";

export const getRecommendations = async (req, res) => {
  try {
    const { genre } = req.query;
    const userId = req.user.uid; // assuming auth middleware adds req.user

    if (!genre) {
      return res.status(400).json({ error: "Genre required" });
    }

    // Fetch Spotify tracks for the genre
    const genreTracks = await searchTracks(genre, 50); // top 50 tracks

    // Fetch user profile
    const userDoc = await db.collection("users").doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data() : { preferredGenres: [], likedTracks: [] };

    // Fetch engagement data for all tracks
    const engagementDocs = await db.collection("engagement").get();
    const engagementData = {};
    engagementDocs.forEach(doc => {
      engagementData[doc.id] = doc.data();
    });

    // Calculate  score for each track
    const scoredTracks = genreTracks.map(track => {
      const score = calculateScore(track, userProfile, engagementData);
      return { ...track, score };
    });

    //Sort tracks by score in descending order
    const recommendations = scoredTracks.sort((a, b) => b.score - a.score).slice(0, 20);

    res.json({
      recommendations,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Recommendation error" });
  }
};