import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../components/Footer";
import Recommendations from "../components/Recommendations";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../css/Home.css";

function Home() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("spotifyToken");

    if (token) {
      localStorage.setItem("spotifyAccessToken", token);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  const username = user?.email ? user.email.split("@")[0] : "Guest";

  return (
    <div className="home-page">
      <NavBar />

      <main className="home-container">
        {/* HERO SECTION */}
        <section className="hero-section">
          {loadingAuth ? (
            <>
              <Skeleton height={40} width={300} />
              <Skeleton height={20} width={500} style={{ marginTop: 20 }} />
              <Skeleton height={50} width={180} style={{ marginTop: 30 }} />
            </>
          ) : (
            <>
              <h1>
                {user ? `Welcome back, ${username}` : "Welcome to SignalFM 🎧"}
              </h1>

              <p className="hero-subtitle">
                Discover new music, build playlists, and explore personalized
                recommendations.
              </p>

              <button
                onClick={() =>
                  (window.location.href = `${
                    import.meta.env.VITE_API_URL
                  }/api/spotify/login`)
                }
              >
                Connect Spotify
              </button>

              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() =>
                    document
                      .querySelector(".search-container")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  🔍 Start Exploring
                </button>
              </div>

              {!user && (
                <p className="guest-message">
                  Login to unlock personalized recommendations ✨
                </p>
              )}
            </>
          )}
        </section>

        {/* RECOMMENDATIONS */}
        <section className="recommendation-section">
          <Recommendations />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
