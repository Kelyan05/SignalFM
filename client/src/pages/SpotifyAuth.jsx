import { useEffect } from "react";

function SpotifyAuth() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const access = params.get("access_token");
    const refresh = params.get("refresh_token");

    if (access) {
      localStorage.setItem("spotify_access_token", access);
    }

    if (refresh) {
      localStorage.setItem("spotify_refresh_token", refresh);
    }

    // redirect back to app
    window.location.href = "/home";
  }, []);

  return <div>Connecting Spotify...</div>;
}

export default SpotifyAuth;
