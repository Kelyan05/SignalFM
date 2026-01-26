import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

function Playlist() {
  return (
    <div className="playlist-empty">
      <NavBar />
      <h2>No playlists yet</h2>
      <p>Start adding playlists and they will appear here</p>
      <Footer />
    </div>
  );
}

export default Playlist;
