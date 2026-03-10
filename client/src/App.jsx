import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Playlist from "./pages/Playlist.jsx";
import Discover from "./pages/Discover.jsx";
import SharedPlaylist from "./pages/SharedPlaylist.jsx";
import SpotifyAuth from "./pages/SpotifyAuth.jsx";

import SpotifyPlayer from "./components/SpotifyPlayer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";

import { PlayerProvider } from "./context/PlayerProvider.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (loadingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <PlayerProvider>
      <main className="main-content">
        <Routes>
          {/* public */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* spotify redirect */}
          <Route path="/spotify-auth" element={<SpotifyAuth />} />

          {/* protected routes */}

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

        <SpotifyPlayer />
      </main>
    </PlayerProvider>
  );
}

export default App;
