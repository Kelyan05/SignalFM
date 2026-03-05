import express from "express";
import { getSharedPlaylist } from "../controllers/shareController.js";

const router = express.Router();

router.get("/:playlistId", getSharedPlaylist);

// Health test route (very useful for deployment)
router.get("/", (req, res) => {
    res.json({ message: "Playlist sharing API is working" });
  });
export default router;