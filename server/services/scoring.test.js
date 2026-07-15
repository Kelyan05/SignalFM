import { describe, it, expect } from "vitest";
import {
  W_POPULARITY,
  W_RECENCY,
  W_ENGAGEMENT,
  getPopularityScore,
  getRecencyScore,
  getEngagementScore,
  scoreTrack,
  diversifyByArtist,
} from "./scoring.js";

// Fixed clock so recency assertions don't rot as real years pass.
const NOW = new Date("2026-06-01");
const track = (overrides = {}) => ({
  spotifyId: "t1",
  artist: "Artist A",
  popularity: 50,
  release_date: "2026-01-10",
  ...overrides,
});

describe("weights", () => {
  it("sum to exactly 1.0 so the score is a true weighted average", () => {
    expect(W_POPULARITY + W_RECENCY + W_ENGAGEMENT).toBeCloseTo(1.0);
  });
});

describe("engagement score", () => {
  it("is 0 (neutral) when the user has never interacted with the track", () => {
    expect(getEngagementScore(undefined)).toBe(0);
    expect(getEngagementScore({ plays: 0, skips: 0, likes: 0 })).toBe(0);
  });

  it("a like raises a track's final score", () => {
    const base  = scoreTrack(track(), undefined, NOW);
    const liked = scoreTrack(track(), { likes: 1 }, NOW);
    expect(liked).toBeGreaterThan(base);
  });

  it("a skip lowers a track's final score — below never-heard tracks", () => {
    const base    = scoreTrack(track(), undefined, NOW);
    const skipped = scoreTrack(track(), { skips: 3 }, NOW);
    expect(skipped).toBeLessThan(base);
    expect(getEngagementScore({ skips: 3 })).toBeLessThan(0);
  });

  it("log compression: the 50th play is worth less than the 2nd", () => {
    const step1 = getEngagementScore({ plays: 2 })  - getEngagementScore({ plays: 1 });
    const step2 = getEngagementScore({ plays: 50 }) - getEngagementScore({ plays: 49 });
    expect(step1).toBeGreaterThan(step2);
    expect(step2).toBeGreaterThan(0); // still monotonic
  });

  it("is clamped to [-1, 1] so extreme counts cannot dominate the formula", () => {
    expect(getEngagementScore({ likes: 100000, plays: 100000 })).toBe(1);
    expect(getEngagementScore({ skips: 100000 })).toBe(-1);
  });

  it("a like outweighs a play (explicit beats implicit)", () => {
    expect(getEngagementScore({ likes: 1 })).toBeGreaterThan(
      getEngagementScore({ plays: 1 })
    );
  });
});

describe("popularity and recency", () => {
  it("normalises Spotify popularity to [0, 1] and handles missing values", () => {
    expect(getPopularityScore({ popularity: 100 })).toBe(1);
    expect(getPopularityScore({ popularity: 0 })).toBe(0);
    expect(getPopularityScore({})).toBe(0);
  });

  it("decays recency to 0 at the horizon and handles all Spotify date precisions", () => {
    expect(getRecencyScore(track({ release_date: "2026-05-01" }), NOW)).toBe(1);
    expect(getRecencyScore(track({ release_date: "2020-01-01" }), NOW)).toBe(0);
    expect(getRecencyScore(track({ release_date: "2025" }), NOW)).toBeCloseTo(2 / 3);
    expect(getRecencyScore(track({ release_date: "" }), NOW)).toBe(0);
    expect(getRecencyScore(track({ release_date: "not-a-date" }), NOW)).toBe(0);
  });
});

describe("final score composition", () => {
  it("with no engagement, the score is exactly the popularity + recency terms", () => {
    const t = track({ popularity: 80, release_date: "2026-01-01" });
    expect(scoreTrack(t, undefined, NOW)).toBeCloseTo(W_POPULARITY * 0.8 + W_RECENCY * 1);
  });

  it("personalisation can beat popularity: a liked niche track outranks an untouched hit", () => {
    const hit   = track({ spotifyId: "hit",   popularity: 95 });
    const niche = track({ spotifyId: "niche", popularity: 30 });
    const hitScore   = scoreTrack(hit, undefined, NOW);
    const nicheScore = scoreTrack(niche, { likes: 5, plays: 10 }, NOW);
    expect(nicheScore).toBeGreaterThan(hitScore);
  });
});

describe("artist diversity", () => {
  it("keeps only the first (highest-scoring) track per artist", () => {
    const sorted = [
      { spotifyId: "1", artist: "A", score: 0.9 },
      { spotifyId: "2", artist: "A", score: 0.8 },
      { spotifyId: "3", artist: "B", score: 0.7 },
    ];
    const out = diversifyByArtist(sorted);
    expect(out.map((t) => t.spotifyId)).toEqual(["1", "3"]);
  });
});
