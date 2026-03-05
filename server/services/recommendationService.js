export const calculateScore = (
    track,
    userProfile,
    engagementData
  ) => {
    const genreMatch = userProfile.preferredGenres?.includes(track.primaryGenre)
      ? 1
      : 0;
  
    const popularityScore = track.popularity / 100;
  
    const releaseYear = new Date(track.release_date).getFullYear();
    const currentYear = new Date().getFullYear();
    const recencyScore = 1 - (currentYear - releaseYear) / 20;
  
    const engagementScore =
      engagementData[track.id]?.likes
        ? Math.min(engagementData[track.id].likes / 100, 1)
        : 0;
  
    return (
      genreMatch * 0.40 +   // more weight now
      popularityScore * 0.25 +
      recencyScore * 0.15 +
      engagementScore * 0.20
    );
  };