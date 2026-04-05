import { db } from "../config/firebaseAdmin.js";

export const getEngagementData = async (trackIds) => {
  const data = {};

  const docs = await Promise.all(
    trackIds.map(id => db.collection("engagement").doc(id).get())
  );

  docs.forEach((doc, i) => {
    if (doc.exists) {
      data[trackIds[i]] = doc.data();
    }
  });

  return data;
};