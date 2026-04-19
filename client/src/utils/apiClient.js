import { auth } from "../config/firebase";

export const apiFetch = async (url, options = {}) => {
  const user = auth.currentUser;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
};