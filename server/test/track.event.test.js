import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { fakeDb } from "./setup.js";
import { mockAuthedUser, authHeader } from "./authHelper.js";

const UID = "user-1";

beforeEach(() => {
  fakeDb._reset();
  mockAuthedUser(UID);
});

describe("POST /api/track/event", () => {
  it("rejects requests with no Authorization header", async () => {
    const res = await request(app)
      .post("/api/track/event")
      .send({ trackId: "t1", action: "play" });
    expect(res.status).toBe(401);
  });

  it("rejects a missing trackId or action", async () => {
    const res = await request(app)
      .post("/api/track/event")
      .set(authHeader())
      .send({ action: "play" });
    expect(res.status).toBe(400);
  });

  it("rejects an action outside the known set", async () => {
    const res = await request(app)
      .post("/api/track/event")
      .set(authHeader())
      .send({ trackId: "t1", action: "banana" });
    expect(res.status).toBe(400);
  });

  it("accepts a queue event but writes nothing", async () => {
    const res = await request(app)
      .post("/api/track/event")
      .set(authHeader())
      .send({ trackId: "t1", action: "queue" });
    expect(res.status).toBe(200);
    expect(fakeDb._get(`users/${UID}/engagement/t1`)).toBeUndefined();
  });

  it("increments plays across repeated play events", async () => {
    await request(app).post("/api/track/event").set(authHeader()).send({ trackId: "t1", action: "play" });
    await request(app).post("/api/track/event").set(authHeader()).send({ trackId: "t1", action: "play" });

    expect(fakeDb._get(`users/${UID}/engagement/t1`).plays).toBe(2);
  });

  it("floors likes at zero so a duplicate unlike can't go negative", async () => {
    await request(app).post("/api/track/event").set(authHeader()).send({ trackId: "t1", action: "unlike" });
    await request(app).post("/api/track/event").set(authHeader()).send({ trackId: "t1", action: "unlike" });

    expect(fakeDb._get(`users/${UID}/engagement/t1`).likes).toBe(0);
  });

  it("takes the writer's identity from the verified token, never the body", async () => {
    await request(app)
      .post("/api/track/event")
      .set(authHeader())
      .send({ trackId: "t1", action: "like", userId: "someone-else" });

    expect(fakeDb._get(`users/${UID}/engagement/t1`).likes).toBe(1);
    expect(fakeDb._get(`users/someone-else/engagement/t1`)).toBeUndefined();
  });
});
