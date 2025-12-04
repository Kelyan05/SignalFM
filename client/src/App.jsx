import './css/App.css'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Playlist from './pages/Playlist.jsx'
import Profile from './pages/Profile.jsx'
import SignUp from './pages/SignUp.jsx'
import {Routes, Route} from "react-router-dom"
import NavBar from './components/NavBar.jsx'
import Api from "./services/Api.js"

function App() {

  return (
    <div>
      <NavBar />
      <Api />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>
    </div>

  );
}

export default App
