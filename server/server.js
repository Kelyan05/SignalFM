// Example using Express
import express from "express"; //used to create the server
import axios from "axios"; //used to make HTTP requests
import cors from "cors"; //used to allow cross-origin requests
import dotenv from "dotenv"; //used to load client id and secret from .env file

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;


app.get("/spotify-token", async (req, res) => {
    try {
      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
          },
        }
      );
  
      res.json({ accessToken: tokenResponse.data.access_token });
    } catch (error) {
      console.error("Spotify token error:", error.message);
      res.status(500).json({ error: "Spotify token error" }); // <-- send JSON instead of plain text
    }
  });
  

app.listen(3001, () => console.log("Server running on 3001"));
