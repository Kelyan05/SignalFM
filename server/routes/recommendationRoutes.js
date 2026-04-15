import express from "express";
import { getRecommendations, invalidateRecommendations } from "../controllers/recommendationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getRecommendations);
router.post("/invalidate", authMiddleware, invalidateRecommendations);

export default router;