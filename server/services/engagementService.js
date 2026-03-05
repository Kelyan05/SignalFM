import admin from "firebase-admin";
import { db } from "../config/firebaseAdmin.js";

export const likeTrack = async (userId, trackId) => {
  const engagementRef = db.collection("engagement").doc(trackId);
  const userRef = db.collection("users").doc(userId);

  await engagementRef.set(
    {
      likes: admin.firestore.FieldValue.increment(1),
    },
    { merge: true }
  );

  await userRef.set(
    {
      likedTracks: admin.firestore.FieldValue.arrayUnion(trackId),
      interactionCount: admin.firestore.FieldValue.increment(1),
    },
    { merge: true }
  );
};