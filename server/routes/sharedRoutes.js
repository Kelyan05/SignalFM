import express from "express";
import { getSharedPlaylist } from "../controllers/shareController.js";

const router = express.Router();

router.get("/:playlistId", getSharedPlaylist);

export default router;