import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="home">
      <NavBar />
      <p>{user ? `Logged in as: ${user.email}` : "Not logged in"}</p>

      {user && <button onClick={logout}>Logout</button>}
    </div>
  );
}

export default Home;
