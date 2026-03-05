import { searchTracks } from "../services/spotifyService.js";

export const getRecommendations = async (req, res) => {
  try {
    const { genre } = req.query;

    if (!genre) {
      return res.status(400).json({ error: "Genre required" });
    }

    const tracks = await searchTracks(genre, 0);

    res.json({
      artistTracks: tracks,
      genreTracks: tracks
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Recommendation error"
    });
  }
};