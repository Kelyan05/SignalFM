import { useState } from "react";
import TrackCard from "./TrackCard";

function PlaylistCard({
  playlist,
  onRename,
  onRemoveTrack,
  onShare
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist.name);

  const saveName = () => {
    onRename(playlist.id, name);
    setEditing(false);
  };

  return (
    <div className="playlist-box">
      {editing ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={saveName}>Save</button>
        </>
      ) : (
        <h2 onClick={() => setEditing(true)}>
          {playlist.name}
        </h2>
      )}

      <button
        className="share-btn"
        onClick={() => onShare(playlist.id)}
      >
        Share Playlist
      </button>

      <div className="track-grid">
        {playlist.tracks?.map((track) => (
          <TrackCard
            key={track.spotifyId}
            track={track}
            onRemove={(spotifyId) =>
              onRemoveTrack(playlist.id, spotifyId)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default PlaylistCard;