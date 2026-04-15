import { auth } from "../config/firebase";

// Unified function to send track events (like, play, skip, etc.) to the server on all pages
export const sendTrackEvent = async ({ track, action, metadata = {} }) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    const token = await user.getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/track/event`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackId: track.spotifyId, // unified ID
          action,                   // unified action
          ...metadata,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

  } catch (err) {
    console.error(`Track event (${action}) failed:`, err.message);
  }
};