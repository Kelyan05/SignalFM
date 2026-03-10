import { likeTrack } from "../services/engagementService.js";

export const likeTrackHandler = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { trackId } = req.body;
    await likeTrack(userId, trackId);
    res.status(200).json({ message: "Track liked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to like track" });
  }
};