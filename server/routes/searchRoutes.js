import express from "express";
import { searchSpotifyTracks } from "../controllers/searchController.js";

const router = express.Router();

router.get("/search", searchSpotifyTracks);

export default router;