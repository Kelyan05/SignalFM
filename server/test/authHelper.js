import { verifyIdToken } from "./setup.js";

export const AUTH_TOKEN = "test-id-token";

export function mockAuthedUser(uid) {
  verifyIdToken.mockImplementation(async (token) => {
    if (token !== AUTH_TOKEN) throw new Error("invalid token");
    return { uid };
  });
}

export const authHeader = () => ({ Authorization: `Bearer ${AUTH_TOKEN}` });
