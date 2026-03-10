import express from "express";
import { getSpotifyAccessToken } from "../controllers/spotifyController.js";

const router = express.Router();

router.get("/token", getSpotifyAccessToken);

export default router;