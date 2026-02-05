import { useEffect, useState } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const ONE_DAY = 1000 * 60 * 60 * 24;

function Recommendations() {
  const [accessToken, setAccessToken] = useState(null);
  const [artistRecs, setArtistRecs] = useState([]);
  const [genreRecs, setGenreRecs] = useState([]);
  const [popularity, setPopularity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(
          "https://signalfm-api.onrender.com/spotify-token"
        );
        if (!res.ok) throw new Error("Failed to fetch Spotify token");
        const data = await res.json();
        setAccessToken(data.accessToken);
      } catch (err) {
        console.error("Error fetching token:", err);
        setError("Failed to connect to Spotify. Please try again later.");
      }
    };
    fetchToken();
  }, []);

  const fetchUserTracks = async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const playlistsRef = collection(db, "users", user.uid, "playlists");
      const snap = await getDocs(playlistsRef);

      let tracks = [];
      snap.forEach((doc) => {
        tracks = tracks.concat(doc.data().tracks || []);
      });

      return tracks;
    } catch (err) {
      console.error("Error fetching user tracks:", err);
      throw new Error("Failed to load your playlists");
    }
  };

  const isExpired = (timestamp) => Date.now() - timestamp > ONE_DAY;

  const fetchRecommendations = async () => {
    if (!accessToken) return;
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheRef = doc(db, "users", user.uid, "recommendations", "current");
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        const cached = cacheSnap.data();
        if (
          !isExpired(cached.generatedAt) &&
          (cached.artistTracks?.length > 0 || cached.genreTracks?.length > 0)
        ) {
          setArtistRecs(cached.artistTracks || []);
          setGenreRecs(cached.genreTracks || []);
          setLoading(false);
          return;
        }
      }

      // Fetch user's tracks
      const userTracks = await fetchUserTracks();
      if (userTracks.length === 0) {
        setArtistRecs([]);
        setGenreRecs([]);
        setLoading(false);
        return;
      }

      // Analyze user's music preferences
      const artistCounts = {};
      const genreCounts = {};
      userTracks.forEach((t) => {
        if (t.artist)
          artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
        if (t.genre) genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1;
      });

      const topArtists = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([artist]) => artist);

      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([genre]) => genre);

      // Helper function to fetch tracks from Spotify
      const fetchTracks = async (query, limit = 20) => {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            query
          )}&type=track&limit=${limit}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) {
          throw new Error(`Spotify API error: ${res.status}`);
        }
        const data = await res.json();
        return data.tracks?.items || [];
      };

      const existingIds = new Set(userTracks.map((t) => t.spotifyId));

      // Fetch artist recommendations in parallel
      const artistPromises = topArtists.map((artist) =>
        fetchTracks(`artist:${artist}`, 20)
      );
      const artistResults = await Promise.all(artistPromises);

      const artistTracks = [];
      artistResults.forEach((items) => {
        for (const t of items) {
          if (!existingIds.has(t.id)) {
            artistTracks.push({
              spotifyId: t.id,
              id: t.id,
              title: t.name,
              artist: t.artists[0]?.name ?? "Unknown Artist",
              albumUrl: t.album.images[0]?.url ?? null,
              explicit: t.explicit ?? false,
              popularity: t.popularity ?? 0,
            });
          }
        }
      });

      // Fetch genre recommendations in parallel
      const genrePromises = topGenres.map((genre) =>
        fetchTracks(`genre:${genre}`, 20)
      );
      const genreResults = await Promise.all(genrePromises);

      const genreTracks = [];
      genreResults.forEach((items) => {
        for (const t of items) {
          if (!existingIds.has(t.id)) {
            genreTracks.push({
              spotifyId: t.id,
              id: t.id,
              title: t.name,
              artist: t.artists[0]?.name ?? "Unknown Artist",
              albumUrl: t.album.images[0]?.url ?? null,
              explicit: t.explicit ?? false,
              popularity: t.popularity ?? 0,
            });
          }
        }
      });

      // Cache the results
      await setDoc(cacheRef, {
        artistTracks,
        genreTracks,
        generatedAt: Date.now(),
        sourceArtists: topArtists.slice(0, 3),
        sourceGenres: topGenres,
      });

      setArtistRecs(artistTracks);
      setGenreRecs(genreTracks);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(
        err.message || "Failed to load recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Filter recommendations by popularity on the client side
  const filteredArtistRecs = artistRecs.filter(
    (track) => track.popularity >= popularity
  );
  const filteredGenreRecs = genreRecs.filter(
    (track) => track.popularity >= popularity
  );

  return (
    <div className="filters">
      <label>
        Popularity (minimum: {popularity})
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={popularity}
          onChange={(e) => setPopularity(Number(e.target.value))}
        />
      </label>

      <h3>Recommended for you</h3>

      {error && (
        <div
          className="error-message"
          style={{ color: "red", padding: "10px" }}
        >
          {error}
        </div>
      )}

      {loading && <p>Loading recommendations...</p>}

      {!loading &&
        !error &&
        filteredArtistRecs.length === 0 &&
        filteredGenreRecs.length === 0 && (
          <p>
            {artistRecs.length > 0 || genreRecs.length > 0
              ? "No tracks match your popularity filter. Try lowering it!"
              : "Add some songs to your playlist to get recommendations 🎧"}
          </p>
        )}

      {filteredArtistRecs.length > 0 && (
        <>
          <h4>Based on your favorite artists</h4>
          <div className="track-grid">
            {filteredArtistRecs.map((track) => (
              <TrackSearchResult key={track.id} track={track} />
            ))}
          </div>
        </>
      )}

      {filteredGenreRecs.length > 0 && (
        <>
          <h4>Based on your favorite genres</h4>
          <div className="track-grid">
            {filteredGenreRecs.map((track) => (
              <TrackSearchResult key={track.id} track={track} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Recommendations;
