import { db }                  from "../config/firebaseAdmin.js";
import { invalidateUserCache } from "../services/recommendationService.js";

/**
 * POST /api/track/event
 * Records a track interaction.
 * userId is always taken from the verified JWT — never from req.body.
 */
export const recordTrackEvent = async (req, res) => {
  try {
    const { trackId, action, duration = 0 } = req.body;
    const userId = req.user.uid;

    if (!trackId || !action) {
      return res.status(400).json({ error: "trackId and action are required" });
    }

    const validActions = ["play", "skip", "like", "unlike", "queue"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${validActions.join(", ")}` });
    }

    const trackRef = db.collection("engagement").doc(trackId);

    await db.runTransaction(async (t) => {
      const docSnap = await t.get(trackRef);
      const data    = docSnap.exists
        ? docSnap.data()
        : { plays: 0, skips: 0, likes: 0, duration: 0 };

      switch (action) {
        case "play":
          data.plays    = (data.plays    || 0) + 1;
          data.duration = (data.duration || 0) + duration;
          break;
        case "skip":
          data.skips = (data.skips || 0) + 1;
          break;
        case "like":
          data.likes = (data.likes || 0) + 1;
          break;
        case "unlike":
          data.likes = Math.max((data.likes || 1) - 1, 0);
          break;
        case "queue":
          // Logged for analytics; does not affect the engagement score directly
          break;
      }

      t.set(trackRef, data, { merge: true });
    });

    // Bust the recommendation cache — fire-and-forget, no need to await
    invalidateUserCache(userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[trackController] recordTrackEvent:", err);
    return res.status(500).json({ error: "Failed to record track event" });
  }
};

/**
 * POST /api/track/stats
 * Returns aggregated engagement for a list of track IDs.
 */
export const getTrackStats = async (req, res) => {
  try {
    const { trackIds } = req.body;
    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      return res.status(400).json({ error: "trackIds array required" });
    }

    const docs = await Promise.all(
      trackIds.map((id) => db.collection("engagement").doc(id).get())
    );

    const data = {};
    docs.forEach((doc, i) => {
      data[trackIds[i]] = doc.exists ? doc.data() : {};
    });

    return res.status(200).json({ data });
  } catch (err) {
    console.error("[trackController] getTrackStats:", err);
    return res.status(500).json({ error: "Failed to fetch track stats" });
  }
};