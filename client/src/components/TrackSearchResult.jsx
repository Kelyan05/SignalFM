import React from "react";
import "../css/TrackSearchResult.css";

function TrackSearchResult({ track }) {
  return (
    <div className="track-card">
      <img src={track.albumUrl} alt={track.title} className="track-image" />
      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
      </div>
    </div>
  );
}

export default TrackSearchResult;
