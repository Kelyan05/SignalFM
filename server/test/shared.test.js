import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { fakeDb } from "./setup.js";

beforeEach(() => {
  fakeDb._reset();
});

describe("GET /api/shared/:playlistId", () => {
  it("404s when the playlist doesn't exist", async () => {
    const res = await request(app).get("/api/shared/nope");
    expect(res.status).toBe(404);
  });

  it("returns the playlist document when it exists", async () => {
    fakeDb._seed("playlists/p1", { ownerId: "user-1", name: "Chill", tracks: [] });

    const res = await request(app).get("/api/shared/p1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ownerId: "user-1", name: "Chill", tracks: [] });
  });
});
