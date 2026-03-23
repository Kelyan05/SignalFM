// services/collaborativeService.js

export const getCollaborativeScore = (trackId, userId, allEngagements) => {
    // Step 1: Find users who liked this track
    const usersWhoLikedTrack = new Set();
  
    allEngagements.forEach(e => {
      if (e.trackId === trackId && e.liked) {
        usersWhoLikedTrack.add(e.userId);
      }
    });
  
    // Step 2: Find tracks those users also liked
    const trackCounts = {};
  
    allEngagements.forEach(e => {
      if (usersWhoLikedTrack.has(e.userId) && e.liked) {
        trackCounts[e.trackId] = (trackCounts[e.trackId] || 0) + 1;
      }
    });
  
    // Step 3: Normalize score
    const maxCount = Math.max(...Object.values(trackCounts), 1);
  
    return (trackCounts[trackId] || 0) / maxCount;
  };