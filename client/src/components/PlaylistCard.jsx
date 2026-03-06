import { useState } from "react";
import TrackCard from "./TrackCard";
import "../css/PlaylistCard.css";

function PlaylistCard({
  playlist,
  onRename,
  onRemoveTrack,
  onShare,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist.name);

  const saveName = () => {
    if (!name.trim()) return;

    onRename(playlist.id, name.trim());
    setEditing(false);
  };

  const getPlaylistCover = () => {
    if (!playlist.tracks || playlist.tracks.length === 0) {
      return "/default-playlist.png";
    }

    if (playlist.tracks.length === 1) {
      return playlist.tracks[0].albumUrl || "/default-playlist.png";
    }

    return null;
  };

  return (
    <div className="playlist-box">
      <div className="playlist-header">
        {editing ? (
          <div className="playlist-edit">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <button onClick={saveName}>Save</button>
          </div>
        ) : (
          <h2 onClick={() => setEditing(true)}>{playlist.name}</h2>
        )}

        <div className="playlist-cover">
          {playlist.tracks.length <= 1 ? (
            <img src={getPlaylistCover()} alt="playlist cover" />
          ) : (
            <div className="playlist-collage">
              {playlist.tracks.slice(0, 4).map((track) => (
                <img
                  key={track.spotifyId}
                  src={track.albumUrl || "/default-playlist.png"}
                  alt={track.title}
                />
              ))}
            </div>
          )}
        </div>

        <div className="playlist-actions">
          <button className="share-btn" onClick={() => onShare(playlist.id)}>
            Share
          </button>

          <button className="delete-btn" onClick={() => onDelete(playlist.id)}>
            Delete
          </button>
        </div>
      </div>

      <div className="track-grid">
        {playlist.tracks?.map((track) => (
          <TrackCard
            key={track.spotifyId}
            track={track}
            onRemove={(spotifyId) => onRemoveTrack(playlist.id, spotifyId)}
          />
        ))}
      </div>
    </div>
  );
}

export default PlaylistCard;
