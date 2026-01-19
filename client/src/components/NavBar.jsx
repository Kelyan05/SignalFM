import {Link} from "react-router-dom"
import '../css/Navbar.css'

function NavBar() {
    return <nav className="navbar">
        <div className="navbar-brand">
            <Link to="/"><img src="images/logo.png" alt="SignalFM logo" className="logo" /></Link>
        </div>
        <div className="navbar-links">
            <Link to="/" className="nav-link"><img src="" alt="" />Home</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
            <Link to="/signup" className="nav-link">SignUp</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <img className="profile-picture" src="https://i.pinimg.com/736x/26/e7/37/26e737a42c533a07d58b666dbd4f8781.jpg" alt="profile picture" />
        </div>
    </nav>
}

export default NavBar