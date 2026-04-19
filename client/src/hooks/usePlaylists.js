import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  // ── FETCH PLAYLISTS ──
  const fetchPlaylists = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const q = query(
      collection(db, "playlists"),
      where("ownerId", "==", user.uid)
    );

    const snap = await getDocs(q);

    setPlaylists(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        tracks: d.data().tracks ?? [],
      }))
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // ── CREATE ──
  const createPlaylist = async (name) => {
    if (!user) return;

    const id = crypto.randomUUID();

    const newPlaylist = {
      ownerId: user.uid,
      name,
      tracks: [],
      createdAt: new Date(),
    };

    await setDoc(doc(db, "playlists", id), newPlaylist);

    setPlaylists((prev) => [...prev, { id, ...newPlaylist }]);
  };

  // ── ADD TRACK ──
  const addToPlaylist = async (playlistId, track) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updated = [...playlist.tracks, track];

    await updateDoc(doc(db, "playlists", playlistId), {
      tracks: updated,
    });

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, tracks: updated } : p
      )
    );
  };

  // ── REMOVE TRACK ──
  const removeTrack = async (playlistId, spotifyId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updated = playlist.tracks.filter(
      (t) => t.spotifyId !== spotifyId
    );

    await updateDoc(doc(db, "playlists", playlistId), {
      tracks: updated,
    });

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, tracks: updated } : p
      )
    );
  };

  // ── DELETE ──
  const deletePlaylist = async (id) => {
    await deleteDoc(doc(db, "playlists", id));
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  // ── RENAME ──
  const renamePlaylist = async (id, name) => {
    await updateDoc(doc(db, "playlists", id), { name });

    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  return {
    playlists,
    loading,
    createPlaylist,
    addToPlaylist,
    removeTrack,
    deletePlaylist,
    renamePlaylist,
    refresh: fetchPlaylists,
  };
}