import { db }                  from "../config/firebaseAdmin.js";
import { invalidateUserCache } from "../services/recommendationService.js";

const VALID_ACTIONS = ["play", "skip", "like", "unlike", "queue"];

/**
 * POST /api/track/event
 * Records a track interaction for the authenticated user.
 *
 * Schema: users/{uid}/engagement/{trackId} → { plays, skips, likes, updatedAt }
 *
 * Why a per-user subcollection instead of a global engagement/{trackId} doc:
 * the only consumer of this data is "score candidate tracks for THIS user",
 * which becomes a cheap batched point-read of exactly the ~50 candidate IDs
 * (see recommendationService). Tradeoffs:
 *   - Write cost: unchanged — still one document write per event, just under
 *     a user-scoped path.
 *   - Read cost: one db.getAll() of point reads per cache miss; no collection
 *     scans anywhere.
 *   - What we give up: platform-wide totals (e.g. "total plays of track X").
 *     Nothing in the product reads those today. If they're ever needed, the
 *     right move is a global aggregate doc updated in this same transaction
 *     (one extra write per event), NOT scanning every user's subcollection.
 */
export const recordTrackEvent = async (req, res) => {
  try {
    const { trackId, action } = req.body;
    // userId always comes from the verified JWT — never from req.body — so a
    // client cannot write engagement into another user's history.
    const userId = req.user.uid;

    if (!trackId || !action) {
      return res.status(400).json({ error: "trackId and action are required" });
    }
    if (!VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${VALID_ACTIONS.join(", ")}` });
    }

    // "queue" is a UI convenience action, not a preference signal: queueing a
    // track you haven't heard says nothing about liking it. We accept it so
    // the client event API stays uniform, but write nothing.
    if (action === "queue") {
      return res.status(200).json({ success: true });
    }

    const ref = db
      .collection("users").doc(userId)
      .collection("engagement").doc(trackId);

    // Transaction = read-modify-write without lost updates if the same user
    // fires two events for the same track concurrently (e.g. double-click).
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const data = snap.exists
        ? snap.data()
        : { plays: 0, skips: 0, likes: 0 };

      switch (action) {
        case "play":
          data.plays = (data.plays || 0) + 1;
          break;
        case "skip":
          data.skips = (data.skips || 0) + 1;
          break;
        case "like":
          data.likes = (data.likes || 0) + 1;
          break;
        case "unlike":
          data.likes = Math.max((data.likes || 0) - 1, 0);
          break;
      }

      data.updatedAt = new Date();
      t.set(ref, data, { merge: true });
    });

    // The user's taste just changed, so their cached recommendations are stale.
    invalidateUserCache(userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[trackController] recordTrackEvent:", err);
    return res.status(500).json({ error: "Failed to record track event" });
  }
};
