import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import rateLimit from "express-rate-limit";
import searchRoutes from "./routes/searchRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests. Please try again later."
  }
});

app.use(express.json());
app.use(limiter);

const allowedOrigins = [
  "http://localhost:5173",
  "https://signalfm-site.onrender.com"
];

app.use(cors({
  origin: function(origin, callback){
    if (!origin || allowedOrigins.includes(origin)){
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


app.use("/api/recommendations", recommendationRoutes);
app.use("/api", searchRoutes);
app.use("/shared", shareRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});