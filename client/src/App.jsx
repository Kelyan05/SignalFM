import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Playlist from "./pages/Playlist.jsx";
import Discover from "./pages/Discover.jsx";
import { Routes, Route } from "react-router-dom";
import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SharedPlaylist from "./pages/SharedPlaylist.jsx";
import SpotifyPlayer from "./components/SpotifyPlayer.jsx";
import { PlayerProvider } from "./context/PlayerProvider.jsx";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  return (
    <PlayerProvider>
      <div>
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Login />} />

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

          {/* Global Player */}
          <SpotifyPlayer />
        </main>
      </div>
    </PlayerProvider>
  );
}

export default App;
