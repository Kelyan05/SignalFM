import React from 'react'
//Authentication URL
const AUTH_URL = "https://accounts.spotify.com/authorize?client_id=69a8fb711b3543609cffb38d914343af&response_type=code&redirect_uri=http://127.0.0.1:5173&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state"


function Login() {
    return (
        <div> <a className="btn btn-success btn-lg" href={AUTH_URL}>Login With Spotify</a></div>
    );

}



export default Login