import express from "express";
import {
  spotifyLogin,
  spotifyCallback,spotifyToken
} from "../controllers/spotifyController.js";

const router = express.Router();

router.get("/login", spotifyLogin);
router.get("/callback", spotifyCallback);
router.get("/token", spotifyToken);


export default router;