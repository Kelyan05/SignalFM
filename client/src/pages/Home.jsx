import {useState, useEffect} from "react"
import "../css/Home.css"
import Dashboard from "../components/Dashboard";
import NavBar from '../components/NavBar';

function Home() {

    return (
    <div className="home">
        <NavBar />
        <Dashboard />
        <section className="social-section">
        <h2>Friends are Listening</h2>
        <p>
          See playlists your friends liked, shared, or commented on. Connect, share, and enjoy music together — SignalFM makes social music discovery fun and interactive.
        </p>
      </section>
        

        </div>
    );
}

export default Home