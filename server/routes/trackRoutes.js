import express from "express";
import { likeTrackHandler } from "../controllers/trackController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/like", authMiddleware, likeTrackHandler);

export default router;