import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

vi.mock("../utils/spotifyAuth.js", () => ({
  exchangeCodeForToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

import { exchangeCodeForToken, refreshAccessToken } from "../utils/spotifyAuth.js";
import { app } from "../app.js";

beforeEach(() => {
  exchangeCodeForToken.mockReset();
  refreshAccessToken.mockReset();
});

describe("GET /api/spotify/login", () => {
  it("redirects to Spotify's authorize endpoint", async () => {
    const res = await request(app).get("/api/spotify/login");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/accounts\.spotify\.com\/authorize\?/);
  });
});

describe("GET /api/spotify/callback", () => {
  it("400s when no authorization code is supplied", async () => {
    const res = await request(app).get("/api/spotify/callback");
    expect(res.status).toBe(400);
  });

  it("redirects to the frontend with tokens on a successful exchange", async () => {
    process.env.FRONTEND_URL = "http://localhost:5173";
    exchangeCodeForToken.mockResolvedValue({ access_token: "AT", refresh_token: "RT" });

    const res = await request(app).get("/api/spotify/callback?code=abc");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("access_token=AT");
  });
});

describe("GET /api/spotify/token", () => {
  it("400s when no refresh_token is supplied", async () => {
    const res = await request(app).get("/api/spotify/token");
    expect(res.status).toBe(400);
  });

  it("returns a refreshed access token", async () => {
    refreshAccessToken.mockResolvedValue("NEW_TOKEN");

    const res = await request(app).get("/api/spotify/token?refresh_token=abc");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ access_token: "NEW_TOKEN" });
  });
});
