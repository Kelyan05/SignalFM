import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function SharedPlaylist() {
  const { playlistId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/playlists/${playlistId}`
        );

        if (!res.ok) {
          throw new Error("Playlist not found");
        }

        const data = await res.json();
        setPlaylist(data);
      } catch (err) {
        setError("Unable to load playlist");
        console.error(err);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  if (error) return <p>{error}</p>;
  if (!playlist) return <p>Loading...</p>;

  return (
    <div>
      <h1>{playlist.name}</h1>

      <div className="track-grid">
        {playlist.tracks?.map((track) => (
          <div key={track.spotifyId} className="track-card">
            <img
              src={track.albumUrl || "https://via.placeholder.com/200"}
              alt={track.title}
            />

            <div>{track.title}</div>
            <div>{track.artist}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SharedPlaylist;
