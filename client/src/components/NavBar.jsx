import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

import { MdHome, MdSearch } from "react-icons/md";
import { TbPlaylist } from "react-icons/tb";

import "../css/Navbar.css";

function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  const displayName = user?.email ? user.email.split("@")[0] : null;
  const initial = displayName ? displayName[0].toUpperCase() : "?";

  const handleLogout = async () => {
    setOpen(false);
    await signOut(auth);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <Link to="/home">
          <img src="/signalfmlogo.png" alt="SignalFM" className="logo" />
        </Link>
      </div>

      {/* Navigation links */}
      <div className="navbar-links">
        <Link
          to="/home"
          className={`nav-link ${isActive("/home") ? "active" : ""}`}
        >
          <MdHome className="nav-icon" />
          <span>Home</span>
        </Link>

        <Link
          to="/discover"
          className={`nav-link ${isActive("/discover") ? "active" : ""}`}
        >
          <MdSearch className="nav-icon" />
          <span>Discover</span>
        </Link>

        <Link
          to="/playlist"
          className={`nav-link ${isActive("/playlist") ? "active" : ""}`}
        >
          <TbPlaylist className="nav-icon" />
          <span>My Playlists</span>
        </Link>
      </div>

      {/* User profile pill */}
      <div className="navbar-profile">
        {displayName ? (
          <button
            className="navbar-user-pill"
            onClick={() => setOpen((p) => !p)}
            aria-label="Account menu"
          >
            <span className="navbar-avatar">{initial}</span>
            <span className="navbar-username">{displayName}</span>
          </button>
        ) : (
          <span
            className="profile-picture"
            onClick={() => setOpen((p) => !p)}
            aria-label="Account menu"
            role="button"
            tabIndex={0}
          />
        )}

        {open && (
          <div className="profile-dropdown">
            {displayName && (
              <p
                style={{
                  padding: "8px 14px 4px",
                  fontSize: 12,
                  color: "#555",
                  margin: 0,
                }}
              >
                {user.email}
              </p>
            )}
            <button className="dropdown-item logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
