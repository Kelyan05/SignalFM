import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Playlist from "./pages/Playlist.jsx";
import Discover from "./pages/Discover.jsx";
import SharedPlaylist from "./pages/SharedPlaylist.jsx";
import SpotifyAuth from "./pages/SpotifyAuth.jsx";

import SpotifyPlayer from "./components/SpotifyPlayer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

import { auth } from "./config/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

import { PlayerProvider } from "./context/PlayerProvider.jsx";
import { LikedTracksProvider } from "./context/LikedTracksProvider.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_token_expiry");
        localStorage.removeItem("spotify_refresh_token");
      }
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (loadingAuth) return <div>Loading...</div>;

  const showPlayer = !!user && !!localStorage.getItem("spotify_refresh_token");

  return (
    <ErrorBoundary fallback={<AppCrashFallback />}>
      <LikedTracksProvider>
        <PlayerProvider>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/spotify-auth" element={<SpotifyAuth />} />

              <Route
                path="/home"
                element={
                  <ProtectedRoute user={user}>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/playlist"
                element={
                  <ProtectedRoute user={user}>
                    <Playlist />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/discover"
                element={
                  <ProtectedRoute user={user}>
                    <Discover />
                  </ProtectedRoute>
                }
              />

              <Route path="/shared/:playlistId" element={<SharedPlaylist />} />
            </Routes>

            {/* Isolated in its own boundary: the Web Playback SDK is a third-party
                script integration, and a crash in it shouldn't take down the rest
                of the app. */}
            {showPlayer && (
              <ErrorBoundary>
                <SpotifyPlayer />
              </ErrorBoundary>
            )}
          </main>
        </PlayerProvider>
      </LikedTracksProvider>
    </ErrorBoundary>
  );
}

function AppCrashFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.5rem" }}>Something went wrong.</h1>
      <p style={{ color: "#888", maxWidth: 420 }}>
        SignalFM hit an unexpected error. Reloading the page usually fixes it.
      </p>
      <button className="primary-btn" onClick={() => window.location.assign("/home")}>
        Reload
      </button>
    </div>
  );
}

export default App;
