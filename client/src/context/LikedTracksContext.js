import { createContext } from "react";

export const LikedTracksContext = createContext({
  likedTracks: [],
  fetchLikedTracks: async () => {},
  isLiked: () => false,
});
