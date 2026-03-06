export const getSharedPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;

    console.log("Fetching playlist:", playlistId);

    const playlistRef = db.collection("playlists").doc(playlistId);
    const playlistSnap = await playlistRef.get();

    if (!playlistSnap.exists) {
      return res.status(404).json({
        error: "Playlist not found"
      });
    }

    res.json(playlistSnap.data());

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server error"
    });
  }
};