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

import { auth } from "./config/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

import { PlayerProvider } from "./context/PlayerProvider.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // When user logs out, clear Spotify tokens so the player stops
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

  if (loadingAuth) {
    return <div>Loading...</div>;
  }

  // Show the player only when logged in AND Spotify is connected.
  // Checking user here (not just localStorage) means logout hides it immediately.
  const showPlayer = !!user && !!localStorage.getItem("spotify_refresh_token");

  return (
    <PlayerProvider>
      <main className="main-content">
        <Routes>
          {/* public */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* spotify oauth redirect */}
          <Route path="/spotify-auth" element={<SpotifyAuth />} />

          {/* protected */}
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

        {showPlayer && <SpotifyPlayer />}
      </main>
    </PlayerProvider>
  );
}

export default App;
