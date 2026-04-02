import { db } from "../config/firebaseAdmin.js";
import axios from "axios";
import { getValidAccessToken } from "./authService.js";

export const getTrackFeatures = async (trackIds) => {
  const features = {};
  const missing = [];

  for (const id of trackIds) {
    const doc = await db.collection("trackFeatures").doc(id).get();
    if (doc.exists) {
      features[id] = doc.data();
    } else {
      missing.push(id);
    }
  }

  if (missing.length) {
    const token = await getValidAccessToken();

    const res = await axios.get(
      `https://api.spotify.com/v1/audio-features?ids=${missing.join(",")}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    for (const f of res.data.audio_features) {
      if (!f) continue;

      await db.collection("trackFeatures").doc(f.id).set(f);
      features[f.id] = f;
    }
  }

  return features;
};