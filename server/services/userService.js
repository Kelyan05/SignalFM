import { db } from "../config/firebaseAdmin.js";

export const getUserTaste = async (userId) => {
  const doc = await db.collection("userTaste").doc(userId).get();

  return doc.exists
    ? doc.data()
    : { energy: 0.5, danceability: 0.5, valence: 0.5, tempo: 100 };
};