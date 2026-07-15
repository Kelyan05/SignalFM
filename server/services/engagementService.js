import { db } from "../config/firebaseAdmin.js";

/**
 * Fetch THIS user's engagement docs for a set of candidate track IDs.
 * Returns { [trackId]: { plays, skips, likes } } — missing tracks are simply
 * absent (the scorer treats them as neutral).
 *
 * db.getAll() batches all the point reads into a single round trip, so a
 * 50-candidate request is one RPC rather than 50 sequential reads (the old
 * code fired 50 individual .get() calls — an N+1 pattern).
 */
export const getUserEngagement = async (userId, trackIds) => {
  if (!trackIds.length) return {};

  const refs = trackIds.map((id) =>
    db.collection("users").doc(userId).collection("engagement").doc(id)
  );

  const snaps = await db.getAll(...refs);

  const data = {};
  snaps.forEach((snap, i) => {
    if (snap.exists) data[trackIds[i]] = snap.data();
  });
  return data;
};
