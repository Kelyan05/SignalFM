import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

import { MdHome, MdSearch } from "react-icons/md";
import { TbPlaylist } from "react-icons/tb";

import "../css/NavBar.css";

function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/home">
          <img src="images/logo.png" alt="SignalFM logo" className="logo" />
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/home" className="nav-link">
          <MdHome className="nav-icon" />
          <span>Home</span>
        </Link>

        <Link to="/discover" className="nav-link">
          <MdSearch className="nav-icon" />
          <span>Discover</span>
        </Link>

        <Link to="/playlist" className="nav-link">
          <TbPlaylist className="nav-icon" />
          <span>My Playlists</span>
        </Link>
      </div>

      <div className="navbar-profile">
        <img
          src="https://i.pinimg.com/736x/26/e7/37/26e737a42c533a07d58b666dbd4f8781.jpg"
          alt="profile"
          className="profile-picture"
          onClick={() => setOpen(!open)}
        />

        {open && (
          <div className="profile-dropdown">
            <button onClick={handleLogout} className="dropdown-item logout">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
