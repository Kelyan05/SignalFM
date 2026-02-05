import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Footer from "../components/Footer";
import Recommendations from "../components/Recommendations";

function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  return (
    <div>
      <NavBar />
      <div className="home">
        <section className="welcome-section">
          <h1>{user ? `Welcome back ${user.email}` : "Not logged in"} 👋</h1>
          <p>
            Discover new music, manage your playlists, and explore what others
            are listening to.
          </p>
          <Recommendations />
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
