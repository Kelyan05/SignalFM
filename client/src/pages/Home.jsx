import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Recommendations from "../components/Recommendations";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  FaSpotify,
  FaHeadphones,
  FaListUl,
  FaMagic,
  FaChevronDown,
} from "react-icons/fa";
import "../css/Home.css";

function Home() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        setSpotifyConnected(!!localStorage.getItem("spotify_refresh_token"));
      }
    });
    return unsubscribe;
  }, []);

  const username = user?.email ? user.email.split("@")[0] : "Guest";

  const handleConnectSpotify = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/spotify/login`;
  };

  const scrollToExplore = () => {
    document
      .querySelector(".recommendation-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-page">
      <NavBar />

      <main className="home-container">
        <section className="hero-section">
          {loadingAuth ? (
            <div className="hero-skeleton">
              <Skeleton
                height={44}
                width={320}
                baseColor="#1a1a1a"
                highlightColor="#2a2a2a"
              />
              <Skeleton
                height={20}
                width={460}
                baseColor="#1a1a1a"
                highlightColor="#2a2a2a"
                style={{ marginTop: 18 }}
              />
              <Skeleton
                height={48}
                width={200}
                baseColor="#1a1a1a"
                highlightColor="#2a2a2a"
                style={{ marginTop: 32 }}
              />
            </div>
          ) : (
            <>
              <p className="hero-eyebrow">
                <FaHeadphones style={{ marginRight: 6 }} />
                Your personal music radar
              </p>

              <h1 className="hero-title">
                {user
                  ? `Welcome back, ${username}`
                  : "Discover music that moves you"}
              </h1>

              <p className="hero-subtitle">
                SignalFM learns from what you play, skip, and love — then finds
                what you didn't know you needed.
              </p>

              <div className="hero-actions">
                {!spotifyConnected ? (
                  <button
                    className="spotify-btn"
                    onClick={handleConnectSpotify}
                  >
                    <FaSpotify style={{ fontSize: 18 }} />
                    Connect Spotify
                  </button>
                ) : (
                  <button className="primary-btn" onClick={scrollToExplore}>
                    Start Exploring
                    <FaChevronDown style={{ marginLeft: 8, fontSize: 12 }} />
                  </button>
                )}
              </div>

              {!user && (
                <p className="guest-message">
                  Sign in to unlock personalised recommendations ✨
                </p>
              )}

              {/* Feature pills */}
              <div className="feature-pills">
                <span className="pill">
                  <FaMagic style={{ marginRight: 6, color: "#1db954" }} />
                  Smart recommendations
                </span>
                <span className="pill">
                  <FaListUl style={{ marginRight: 6, color: "#1db954" }} />
                  Playlist builder
                </span>
                <span className="pill">
                  <FaHeadphones style={{ marginRight: 6, color: "#1db954" }} />
                  Real-time playback
                </span>
              </div>
            </>
          )}
        </section>

        <section className="recommendation-section">
          <Recommendations />
        </section>
      </main>

    </div>
  );
}

export default Home;
