import { useEffect, useState } from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Playlist from './pages/Playlist.jsx'
import Discover from './pages/Discover.jsx'
import {Routes, Route} from "react-router-dom"
import NavBar from './components/NavBar.jsx'
import Dashboard from './components/Dashboard.jsx'
import { Auth } from './components/Auth.jsx'
import { db } from './config/firebase'
import { getDocs, collection, doc } from 'firebase/firestore'



function App() {
  const [playlist,setPlaylist] = useState([])

  const playlistsCollectionRef = collection(db, "playlists")

    //loads playlist from the firestore database
    useEffect(() => {
      const getPlaylist = async () => {
        //reads data from firestore
        // sets playlist state
        try {
          const data = await getDocs(playlistsCollectionRef)
          const filteredData = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
          setPlaylist(filteredData) //to see the data in browser console
        } catch (error) {
          console.error("Error fetching playlists: ", error)
      }
      }

      getPlaylist();
    }, []);

  return (
    <div>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/discover" element={<Discover />} />
        </Routes>
      </main>
    </div>

  );
}

export default App;
