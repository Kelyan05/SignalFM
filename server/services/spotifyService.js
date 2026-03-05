import axios from "axios";
import { getSpotifyToken } from "../config/spotify.js";

export const searchTracks = async (query, offset = 0) => {
  const token = await getSpotifyToken();

  const response = await axios.get(
    "https://api.spotify.com/v1/search",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: query,
        type: "track",
        limit: 50,
        offset: Number(offset),
      },
    }
  );

  return response.data.tracks.items.map(track => ({
  id: track.id,
  spotifyId: track.id,
  title: track.name || "Unknown Title",
  artist: track.artists?.[0]?.name || "Unknown Artist",
  albumUrl: track.album?.images?.length
    ? track.album.images[0].url
    : "https://via.placeholder.com/200",
  popularity: track.popularity ?? 0,
  release_date: track.album?.release_date || "",
  explicit: track.explicit ?? false
}));
};