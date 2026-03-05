import { db } from "../config/firebaseAdmin.js";

export const getSharedPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;

    const playlistRef = db.collection("playlists").doc(playlistId);
    const playlistSnap = await playlistRef.get();

    if (!playlistSnap.exists) {
      return res.status(404).json({
        error: "Playlist not found"
      });
    }

    const playlist = playlistSnap.data();

    if (!playlist.public) {
      return res.status(403).json({
        error: "Playlist is private"
      });
    }

    res.json(playlist);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server error"
    });
  }
};