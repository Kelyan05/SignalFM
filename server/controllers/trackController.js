import { db } from "../config/firebaseAdmin.js";

/**
 * Records a track event (play, skip, like, duration)
 */
export const recordTrackEvent = async (req, res) => {
  try {
    const { trackId, action, duration = 0, userId } = req.body;

    if (!trackId || !action || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const trackRef = db.collection("engagement").doc(trackId);

    await db.runTransaction(async (t) => {
      const doc = await t.get(trackRef);
      let data = doc.exists ? doc.data() : { plays: 0, skips: 0, likes: 0, duration: 0 };

      switch (action) {
        case "play":
          data.plays = (data.plays || 0) + 1;
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
        default:
          break;
      }

      t.set(trackRef, data, { merge: true });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Track event error:", err);
    return res.status(500).json({ error: "Failed to record track event" });
  }
};

/**
 * Fetch aggregated engagement for tracks (optional, for recommendations)
 */
export const getTrackStats = async (req, res) => {
  try {
    const { trackIds } = req.body;
    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({ error: "trackIds array required" });
    }

    const data = {};
    const docs = await Promise.all(trackIds.map(id => db.collection("engagement").doc(id).get()));

    docs.forEach((doc, i) => {
      data[trackIds[i]] = doc.exists ? doc.data() : {};
    });

    return res.status(200).json({ data });
  } catch (err) {
    console.error("Get track stats error:", err);
    return res.status(500).json({ error: "Failed to fetch track stats" });
  }
};