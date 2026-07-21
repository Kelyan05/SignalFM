import { useContext } from "react";
import { LikedTracksContext } from "../context/LikedTracksContext";

// Safe hook — throws a clear error if used outside the provider tree
// instead of a cryptic "cannot read property of undefined" crash.
export function useLikedTracks() {
  const ctx = useContext(LikedTracksContext);
  if (!ctx)
    throw new Error("useLikedTracks must be used inside LikedTracksProvider");
  return ctx;
}
