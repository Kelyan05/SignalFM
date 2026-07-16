// ─────────────────────────────────────────────────────────────────────────────
// scoring.js — pure ranking functions for the recommendation engine.
//
// No I/O in this file: everything here is a deterministic function of its
// inputs, which is what makes the engine testable (see scoring.test.js) and
// explainable. The full formula:
//
//   score = W_POPULARITY · popularity(track)
//         + W_RECENCY    · recency(track)
//         + W_ENGAGEMENT · engagement(userEngagement[trackId])
//
// popularity and recency are in [0, 1]; engagement is in [-1, 1] so that a
// track this user keeps skipping ranks BELOW a track they've never heard
// (which scores a neutral 0). The final score is a ranking key, not a
// probability — only the ordering matters.
// ─────────────────────────────────────────────────────────────────────────────

// Weights sum to 1.0 across the three signals.
//
// W_ENGAGEMENT is largest because the user's own history is the only signal
// that is actually personal — it is the whole point of the engine. It only
// kicks in for tracks the user has interacted with; for everything else the
// engagement term is 0 and ranking gracefully falls back to
// popularity + recency, which doubles as the cold-start behaviour for new
// users.
export const W_POPULARITY = 0.35; // Spotify's audience-wide signal: a strong prior for tracks we know nothing personal about.
export const W_RECENCY    = 0.20; // Small freshness nudge; kept low so the engine isn't just a new-releases feed.
export const W_ENGAGEMENT = 0.45; // The personal signal. Largest weight: a like/skip should visibly reorder results.

// Relative strength of each interaction type inside the engagement term.
// A like is a deliberate, explicit signal; a play is weak implicit evidence
// (you may have merely tolerated the track); a skip is a deliberate rejection,
// weighted as strongly negative as a like is positive.
export const ENGAGEMENT_LIKE_WEIGHT = 1.0;
export const ENGAGEMENT_PLAY_WEIGHT = 0.4;
export const ENGAGEMENT_SKIP_WEIGHT = 1.0;

// Raw engagement value at which the signal is treated as "as strong as it
// gets". ln(20 likes + 1) ≈ 3.0, so roughly 20 likes (or an equivalent mix of
// plays) saturates the term. Anything beyond is clamped — the 500th play
// should not matter more than the 20th like.
export const ENGAGEMENT_SATURATION = 3.0;

// A release older than this scores 0 on recency (linear decay in between).
export const RECENCY_HORIZON_YEARS = 3;

const clamp = (x, min, max) => Math.min(max, Math.max(min, x));

// Spotify popularity is 0–100 → normalise to [0, 1].
export const getPopularityScore = (track) => (track.popularity || 0) / 100;

// Linear decay from 1 (released this year) to 0 (RECENCY_HORIZON_YEARS ago).
// Spotify release dates come in three precisions ("1994", "1994-06",
// "1994-06-23"); the first four characters are always the year, which is all
// the precision this signal needs.
export const getRecencyScore = (track, now = new Date()) => {
  const year = Number.parseInt(String(track.release_date || "").slice(0, 4), 10);
  if (!Number.isFinite(year)) return 0;
  const age = now.getFullYear() - year;
  return clamp(1 - age / RECENCY_HORIZON_YEARS, 0, 1);
};

// This user's engagement with one track → [-1, 1].
//   raw = ln(likes+1)·W_like + ln(plays+1)·W_play − ln(skips+1)·W_skip
// Log compression means the 2nd like matters more than the 50th (diminishing
// returns) and no single obsessively-replayed track can dominate; the +1
// guards ln(0). Dividing by the saturation constant and clamping keeps the
// term bounded so the top-level weights mean what they say.
export const getEngagementScore = (engagement) => {
  if (!engagement) return 0;
  const raw =
    Math.log((engagement.likes || 0) + 1) * ENGAGEMENT_LIKE_WEIGHT +
    Math.log((engagement.plays || 0) + 1) * ENGAGEMENT_PLAY_WEIGHT -
    Math.log((engagement.skips || 0) + 1) * ENGAGEMENT_SKIP_WEIGHT;
  return clamp(raw / ENGAGEMENT_SATURATION, -1, 1);
};

// The final weighted sum. `engagement` is this user's stored counts for this
// track (or undefined if they've never interacted with it).
export const scoreTrack = (track, engagement, now = new Date()) =>
  W_POPULARITY * getPopularityScore(track) +
  W_RECENCY * getRecencyScore(track, now) +
  W_ENGAGEMENT * getEngagementScore(engagement);

// One track per artist. Input must already be sorted best-first, so keeping
// the first occurrence keeps each artist's highest-scoring track.
export const diversifyByArtist = (tracks) => {
  const seen = new Set();
  return tracks.filter(({ artist }) => {
    if (seen.has(artist)) return false;
    seen.add(artist);
    return true;
  });
};
