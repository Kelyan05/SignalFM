import { auth } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useState, useEffect } from "react";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid email or password", err);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) return <p>Checking authentication...</p>;

  return (
    <div>
      <p>{user ? `Logged in as: ${user.email}` : "Guest mode"}</p>

      {!user && (
        <>
          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={login}>Login</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}

      {user && <button onClick={logout}>Logout</button>}
    </div>
  );
};
