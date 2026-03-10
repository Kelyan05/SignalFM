import axios from "axios";

export const getSpotifyAccessToken = async (req, res) => {
  try {
    const params = new URLSearchParams();

    params.append("grant_type", "refresh_token");
    params.append("refresh_token", process.env.SPOTIFY_REFRESH_TOKEN);

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.json({
      accessToken: response.data.access_token,
    });
  } catch (error) {
    console.error("Spotify token error:", error.response?.data || error.message);

    res.status(500).json({
      error: "Failed to get Spotify token",
    });
  }
};