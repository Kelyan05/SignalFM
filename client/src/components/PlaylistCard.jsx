import { useState } from "react";
import TrackCard from "./TrackCard";
import "../css/PlaylistCard.css";

/**
 * PlaylistCard
 * Displays a single playlist with rename, share, delete controls,
 * and a grid of TrackCards for its tracks.
 *
 * Props:
 *   playlist        – playlist object { id, name, tracks[] }
 *   onRename(id, name)
 *   onRemoveTrack(playlistId, spotifyId)
 *   onShare(id)
 *   onDelete(id)
 *   onClick()       – called when the card header is clicked (to select it)
 */
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

  // Build a 2x2 collage cover or single image
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

      {/* Track grid — onRemove passed so TrackCard shows the remove button */}
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
