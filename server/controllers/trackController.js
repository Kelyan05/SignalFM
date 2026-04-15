import { db } from "../config/firebaseAdmin.js";
import { invalidateUserCache } from "../services/recommendationService.js";

/**
 * POST /api/track/event
 * Records a track interaction (play, skip, like, unlike).
 * userId is taken from the verified JWT (req.user.uid) — never from the body.
 */
export const recordTrackEvent = async (req, res) => {
  try {
    const { trackId, action, duration = 0 } = req.body;
    const userId = req.user.uid; // always use the verified token, not req.body

    if (!trackId || !action) {
      return res.status(400).json({ error: "trackId and action are required" });
    }

    const validActions = ["play", "skip", "like", "unlike"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${validActions.join(", ")}` });
    }

    const trackRef = db.collection("engagement").doc(trackId);

    await db.runTransaction(async (t) => {
      const doc = await t.get(trackRef);
      const data = doc.exists
        ? doc.data()
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
      }

      t.set(trackRef, data, { merge: true });
    });

    // Bust the recommendation cache so the next fetch re-scores with
    // this interaction included. The invalidation is fire-and-forget —
    // we don't need to await it before responding.
    invalidateUserCache(userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Track event error:", err);
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
    console.error("Get track stats error:", err);
    return res.status(500).json({ error: "Failed to fetch track stats" });
  }
};