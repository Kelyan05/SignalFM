import {Link} from "react-router-dom"
import '../css/Navbar.css'

function NavBar() {
    return <nav className="navbar">
        <div className="navbar-brand">
            <Link to="/home"><img src="images/logo.png" alt="SignalFM logo" className="logo" /></Link>
        </div>
        <div className="navbar-links">
            <Link to="/home" className="nav-link"><img src="" alt="" />Home</Link>
            <Link to="/playlist" className="nav-link">My Playlists</Link>
            <Link to="/discover" className="nav-link">Discover</Link>
            <img className="profile-picture" src="https://i.pinimg.com/736x/26/e7/37/26e737a42c533a07d58b666dbd4f8781.jpg" alt="profile picture" />
        </div>
    </nav>
}

export default NavBar