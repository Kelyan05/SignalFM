import express from "express";
import { recordTrackEvent } from "../controllers/trackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/event", authMiddleware, recordTrackEvent);

export default router;
