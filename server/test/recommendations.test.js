import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

vi.mock("../services/spotifyService.js", () => ({
  searchTracks: vi.fn(),
}));

import { searchTracks } from "../services/spotifyService.js";
import { invalidateUserCache } from "../services/recommendationService.js";
import { app } from "../app.js";
import { fakeDb } from "./setup.js";
import { mockAuthedUser, authHeader } from "./authHelper.js";

const UID = "user-1";

const track = (overrides = {}) => ({
  spotifyId: "t1",
  artist: "Artist A",
  popularity: 50,
  release_date: "2024-01-01",
  ...overrides,
});

beforeEach(() => {
  fakeDb._reset();
  mockAuthedUser(UID);
  invalidateUserCache(UID); // recommendationCache is a module-level singleton; clear it between tests.
  searchTracks.mockReset();
});

describe("GET /api/recommendations", () => {
  it("requires auth", async () => {
    const res = await request(app).get("/api/recommendations?genre=lofi");
    expect(res.status).toBe(401);
  });

  it("requires a genre query param", async () => {
    const res = await request(app).get("/api/recommendations").set(authHeader());
    expect(res.status).toBe(400);
  });

  it("scores candidates and ranks higher popularity first when engagement is equal", async () => {
    searchTracks.mockResolvedValue([
      track({ spotifyId: "a", artist: "A", popularity: 10 }),
      track({ spotifyId: "b", artist: "B", popularity: 90 }),
    ]);

    const res = await request(app).get("/api/recommendations?genre=lofi").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.recommendations).toHaveLength(2);
    expect(res.body.recommendations[0].spotifyId).toBe("b");
  });

  it("caches results for the same user+genre until ?refresh=true is passed", async () => {
    searchTracks.mockResolvedValue([track({ spotifyId: "a" })]);

    await request(app).get("/api/recommendations?genre=lofi").set(authHeader());
    await request(app).get("/api/recommendations?genre=lofi").set(authHeader());
    expect(searchTracks).toHaveBeenCalledTimes(1);

    await request(app).get("/api/recommendations?genre=lofi&refresh=true").set(authHeader());
    expect(searchTracks).toHaveBeenCalledTimes(2);
  });

  it("keeps only the highest-scoring track per artist", async () => {
    searchTracks.mockResolvedValue([
      track({ spotifyId: "a1", artist: "Same Artist", popularity: 80 }),
      track({ spotifyId: "a2", artist: "Same Artist", popularity: 95 }),
    ]);

    const res = await request(app).get("/api/recommendations?genre=lofi&refresh=true").set(authHeader());

    expect(res.body.recommendations).toHaveLength(1);
    expect(res.body.recommendations[0].spotifyId).toBe("a2");
  });

  it("lets a liked track outrank an untouched, more popular one", async () => {
    fakeDb._seed(`users/${UID}/engagement/niche`, { plays: 0, skips: 0, likes: 5 });
    searchTracks.mockResolvedValue([
      track({ spotifyId: "hit", artist: "Hit Artist", popularity: 95 }),
      track({ spotifyId: "niche", artist: "Niche Artist", popularity: 20 }),
    ]);

    const res = await request(app).get("/api/recommendations?genre=lofi&refresh=true").set(authHeader());

    expect(res.body.recommendations[0].spotifyId).toBe("niche");
  });
});
