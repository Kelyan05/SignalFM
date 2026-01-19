import './css/App.css'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Playlist from './pages/Playlist.jsx'
import Profile from './pages/Profile.jsx'
import SignUp from './pages/SignUp.jsx'
import {Routes, Route} from "react-router-dom"
import NavBar from './components/NavBar.jsx'
import Dashboard from './pages/Dashboard.jsx'

const code = new URLSearchParams(window.location.search).get('code')

function App() {

  return (
    <div>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={code ? <Dashboard code={code} /> :  <Login />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>
    </div>

  );
}

export default App
