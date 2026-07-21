import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

vi.mock("../services/spotifyService.js", () => ({
  searchTracks: vi.fn(),
}));

import { searchTracks } from "../services/spotifyService.js";
import { app } from "../app.js";

beforeEach(() => {
  searchTracks.mockReset();
});

describe("GET /api/search", () => {
  it("requires a query string", async () => {
    const res = await request(app).get("/api/search");
    expect(res.status).toBe(400);
  });

  it("rejects an offset outside the allowed pagination range", async () => {
    const res = await request(app).get("/api/search?q=lofi&offset=5000");
    expect(res.status).toBe(400);
  });

  it("returns tracks from the search service, parsing offset as a number", async () => {
    searchTracks.mockResolvedValue([{ spotifyId: "a" }]);

    const res = await request(app).get("/api/search?q=lofi&offset=20");

    expect(res.status).toBe(200);
    expect(res.body.tracks).toEqual([{ spotifyId: "a" }]);
    expect(searchTracks).toHaveBeenCalledWith("lofi", 20);
  });
});
