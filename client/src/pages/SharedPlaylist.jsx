import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TrackSearchResult from "../components/TrackSearchResult.jsx";
import { FaHeadphones, FaMusic } from "react-icons/fa";
import "../css/Playlist.css";
import "../css/Dashboard.css";
import "../css/TrackSearchResult.css";

function SharedPlaylist() {
  const { playlistId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPlaylist = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/shared/${playlistId}`
        );

        if (!res.ok) throw new Error("Playlist not found");

        const data = await res.json();
        if (!cancelled) setPlaylist(data);
      } catch (err) {
        if (!cancelled) setError("This playlist doesn't exist or is no longer shared.");
        console.error(err);
      }
    };

    fetchPlaylist();
    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  const tracks = playlist?.tracks ?? [];

  return (
    <div className="playlist-page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 40px 0",
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 800,
            fontSize: 16,
            color: "#fff",
          }}
        >
          <FaHeadphones color="#1db954" />
          SignalFM
        </Link>
        <Link to="/register" className="primary-btn" style={{ fontSize: 13, padding: "8px 18px" }}>
          Make your own
        </Link>
      </div>

      {error && (
        <div className="rec-feedback">
          <FaMusic />
          <p>{error}</p>
        </div>
      )}

      {!error && !playlist && (
        <div className="track-grid" style={{ padding: "28px 40px 0" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="skeleton-card">
              <div className="skeleton-art" />
              <div className="skeleton-line long" />
              <div className="skeleton-line short" />
            </div>
          ))}
        </div>
      )}

      {playlist && (
        <>
          <div className="playlist-header-row">
            <h1>{playlist.name}</h1>
            <span className="playlist-count">
              {tracks.length} track{tracks.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="playlist-tracks-view">
            {tracks.length === 0 ? (
              <div className="rec-feedback">
                <FaMusic />
                <p>This playlist is empty.</p>
              </div>
            ) : (
              <div className="track-grid">
                {tracks.map((track) => (
                  <TrackSearchResult key={track.spotifyId} track={track} playlists={[]} />
                ))}
              </div>
            )}
          </div>

          <p
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "#535353",
              fontSize: 13,
            }}
          >
            Shared with <Link to="/">SignalFM</Link> — personalised recommendations
            that learn from what you actually play, skip, and like.
          </p>
        </>
      )}
    </div>
  );
}

export default SharedPlaylist;
