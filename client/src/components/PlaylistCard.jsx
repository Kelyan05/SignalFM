import { useState } from "react";
import TrackCard from "./TrackCard";
import "../css/PlaylistCard.css";

function PlaylistCard({
  playlist,
  onRename,
  onRemoveTrack,
  onShare,
  onDelete,
  onClick,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist.name);

  const saveName = () => {
    if (!name.trim()) return;
    onRename(playlist.id, name.trim());
    setEditing(false);
  };

  const renderCover = () => {
    const tracks = playlist.tracks ?? [];
    if (tracks.length === 0) {
      return <img src="/default-playlist.png" alt="playlist cover" />;
    }
    if (tracks.length < 4) {
      return <img src={tracks[0].albumUrl} alt={tracks[0].title} />;
    }
    return (
      <div className="playlist-collage">
        {tracks.slice(0, 4).map((t) => (
          <img key={t.spotifyId} src={t.albumUrl} alt={t.title} />
        ))}
      </div>
    );
  };

  return (
    <div className="playlist-box" onClick={onClick}>
      <div className="playlist-header">
        {/* Inline rename */}
        {editing ? (
          <div className="playlist-edit" onClick={(e) => e.stopPropagation()}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              autoFocus
            />
            <button onClick={saveName}>Save</button>
          </div>
        ) : (
          <h2
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            title="Click to rename"
          >
            {playlist.name}
          </h2>
        )}

        <div className="playlist-cover">{renderCover()}</div>

        <div className="playlist-actions" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onShare(playlist.id)}>Share</button>
          <button onClick={() => onDelete(playlist.id)}>Delete</button>
        </div>
      </div>

      <div className="track-grid">
        {(playlist.tracks ?? []).map((track) => (
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
