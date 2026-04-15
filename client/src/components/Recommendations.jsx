import { useState, useEffect, useCallback } from "react";
import TrackSearchResult from "./TrackSearchResult.jsx";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  FaMusic,
  FaMicrophone,
  FaGlobe,
  FaGuitar,
  FaHatCowboy,
  FaBolt,
  FaRedo,
} from "react-icons/fa";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

const GENRES = [
  { id: "pop", label: "Pop", icon: <FaBolt /> },
  { id: "rap", label: "Rap", icon: <FaMicrophone /> },
  { id: "afro", label: "Afro", icon: <FaGlobe /> },
  { id: "jazz", label: "Jazz", icon: <FaMusic /> },
  { id: "country", label: "Country", icon: <FaHatCowboy /> },
  { id: "rock", label: "Rock", icon: <FaGuitar /> },
];

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-art" />
      <div className="skeleton-line long" />
      <div className="skeleton-line short" />
    </div>
  );
}

function Recommendations() {
  const [tracks, setTracks] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("pop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  // ── Fetch user's playlists ────────────────────────────────────────────────
  useEffect(() => {
    const fetchPlaylists = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const q = query(
          collection(db, "playlists"),
          where("ownerId", "==", user.uid)
        );
        const snap = await getDocs(q);
        setPlaylists(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Playlist fetch error:", err);
      }
    };
    fetchPlaylists();
  }, []);

  // ── Add track to a playlist ───────────────────────────────────────────────
  const handleAddToPlaylist = useCallback(
    async (playlistId, track) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (!playlist) return;

      const alreadyIn = playlist.tracks?.some(
        (t) => t.spotifyId === track.spotifyId
      );
      if (alreadyIn) return;

      const updatedTracks = [
        ...(playlist.tracks || []),
        {
          spotifyId: track.spotifyId,
          title: track.title,
          artist: track.artist,
          albumUrl: track.albumUrl || track.image || "",
        },
      ];

      try {
        await updateDoc(doc(db, "playlists", playlistId), {
          tracks: updatedTracks,
        });
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId ? { ...p, tracks: updatedTracks } : p
          )
        );
      } catch (err) {
        console.error("Failed to add to playlist:", err);
      }
    },
    [playlists]
  );

  // ── Fetch recommendations ─────────────────────────────────────────────────
  const fetchRecommendations = useCallback(async (genre) => {
    const user = auth.currentUser;
    if (!user) {
      setError("Please log in to see recommendations.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations?genre=${genre}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTracks(data.recommendations || []);
    } catch (err) {
      console.error(err);
      setError("Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations(selectedGenre);
  }, [selectedGenre, fetchRecommendations]);

  // ── Invalidate cache after interaction ───────────────────────────────────
  const handleInteraction = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations/invalidate`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecommendations(selectedGenre);
    } catch (err) {
      console.error("Failed to invalidate recommendation cache:", err);
    }
  }, [selectedGenre, fetchRecommendations]);

  const activeGenre = GENRES.find((g) => g.id === selectedGenre);

  return (
    <div className="recommendations-section">
      {/* Header */}
      <div className="rec-header">
        <h2 className="rec-title">Recommended for you</h2>
        {!loading && tracks.length > 0 && (
          <span className="rec-count">
            {tracks.length} {activeGenre?.label} picks
          </span>
        )}
      </div>

      {/* Genre pills */}
      <div className="genre-pills" role="group" aria-label="Select genre">
        {GENRES.map((g) => (
          <button
            key={g.id}
            className={`genre-pill${selectedGenre === g.id ? " active" : ""}`}
            onClick={() => setSelectedGenre(g.id)}
            aria-pressed={selectedGenre === g.id}
          >
            <span className="genre-pill-icon">{g.icon}</span>
            {g.label}
          </button>
        ))}
      </div>

      {/* Skeleton grid */}
      {loading && (
        <div className="track-grid">
          {Array.from({ length: 20 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rec-feedback">
          <FaMusic className="rec-feedback-icon" />
          <p>{error}</p>
          <button
            className="rec-retry-btn"
            onClick={() => fetchRecommendations(selectedGenre)}
          >
            <FaRedo style={{ marginRight: 7 }} />
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && tracks.length === 0 && (
        <div className="rec-feedback">
          <FaMusic className="rec-feedback-icon" />
          <p className="rec-feedback-title">
            No results for {activeGenre?.label}
          </p>
          <p className="rec-feedback-sub">
            Try a different genre or come back later.
          </p>
        </div>
      )}

      {/* Track grid */}
      {!loading && !error && tracks.length > 0 && (
        <div className="track-grid">
          {tracks.map((track, i) => (
            <div
              key={track.spotifyId}
              className="track-card-wrapper"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <TrackSearchResult
                track={track}
                playlists={playlists}
                onAddToPlaylist={handleAddToPlaylist}
                onInteraction={handleInteraction}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recommendations;
