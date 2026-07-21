import { vi } from "vitest";
import { createFakeFirestore } from "./fakeFirestore.js";

// config/firebaseAdmin.js parses this at import time; it's never read for
// real since firestore()/auth() are mocked below, but JSON.parse needs
// something well-formed to chew on.
process.env.FIREBASE_SERVICE_ACCOUNT ??= "{}";

export const fakeDb = createFakeFirestore();
export const verifyIdToken = vi.fn();

// We mock the firebase-admin package itself rather than Firestore alone,
// because authMiddleware calls admin.auth().verifyIdToken() directly — the
// one piece of every request we don't own or want to test (it's Google's
// code). Everything downstream of it (Firestore reads/writes, transactions)
// runs against the fake above so the actual route → middleware → controller
// → service pipeline is exercised for real.
vi.mock("firebase-admin", () => ({
  default: {
    credential: { cert: () => ({}) },
    initializeApp: () => {},
    firestore: () => fakeDb,
    auth: () => ({ verifyIdToken }),
  },
}));
