// controllers/searchController.js
import { searchTracks } from "../services/spotifyService.js";

// Handles /search endpoint
export const searchSpotifyTracks = async (req, res) => {
  try {
    const { q, offset = 0 } = req.query;

    if (offset > 1000) {
      return res.status(400).json({ error: "Pagination limit exceeded" });
    }

    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    // searchTracks now uses unified cache internally
    const tracks = await searchTracks(q, offset);

    return res.status(200).json({ tracks: tracks || [] });

  } catch (error) {
    console.error("Search Controller Error:", error.message);
    return res.status(500).json({ error: "Internal Search Error" });
  }
};