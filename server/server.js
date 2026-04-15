import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import recommendationRoutes from "./routes/recommendationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import shareRoutes from "./routes/sharedRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import spotifyRoutes from "./routes/spotifyRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "https://signalfm-site.onrender.com",
    "http://127.0.0.1:5173",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api/recommendations", recommendationRoutes);
app.use("/api", searchRoutes);
app.use("/api/shared", shareRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/spotify", spotifyRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SignalFM server running on port ${PORT}`);
});