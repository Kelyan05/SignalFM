export function normalizeTrack(track) {
    return {
      id: track.spotifyId || track.id,
      title: track.title,
      artist: track.artist,
      image: track.albumUrl || track.image || "",
      source: track.source || "spotify",
    };
  }