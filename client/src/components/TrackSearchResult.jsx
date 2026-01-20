import React from 'react'

function TrackSearchResult({track}) {

  return (
    <div>
      <img src={track.albumUrl} style={{ height: "64px", width: "64px"}}/>
      <div className="ml-3">
        <div>{track.title}</div>
        <div>{track.artist}</div>
      </div>
    </div>
  )
}

export default TrackSearchResult
