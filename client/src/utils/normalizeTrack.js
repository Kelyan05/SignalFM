export function normalizeTrack(track) {
  return {
    spotifyId: track.spotifyId || track.id,
    title: track.title,
    artist: track.artist,
    albumUrl: track.albumUrl || track.image || "",
    image: track.albumUrl || track.image || "", 
    source: track.source || "spotify",
  };
}