import express from "express";
import { recordTrackEvent, getTrackStats } from "../controllers/trackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/event", authMiddleware, recordTrackEvent);
router.post("/stats", authMiddleware, getTrackStats);

export default router;