import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";

import recommendationRoutes from "./routes/recommendationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import shareRoutes from "./routes/sharedRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import spotifyRoutes from "./routes/spotifyRoutes.js";

dotenv.config();

const app = express();

// CORS + Middleware
app.use(cors({
  origin: [
    "https://signalfm-site.onrender.com",
    "http://127.0.0.1:5173",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use("/api/recommendations", recommendationRoutes);
app.use("/api", searchRoutes);
app.use("/api/shared", shareRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/spotify", spotifyRoutes);

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  ws.on("message", (msg) => {
    console.log("Received:", msg.toString());
    // You can broadcast to all clients if needed:
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) client.send(msg.toString());
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SignalFM server running on port ${PORT}`);
});