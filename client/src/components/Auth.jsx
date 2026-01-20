import { auth } from "../config/firebase"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { useState, useEffect } from "react"

export const Auth = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [user, setUser] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, currentUser => {
      setUser(currentUser)
    })
  }, [])

  const login = async () =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = async () =>
    signOut(auth)

  return (
    <div>
      <p>
        {user ? `Logged in as: ${user.email}` : "Not logged in"}
      </p>

      {!user && (
        <>
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input
            placeholder="Password"
            type="password"
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={login}>Login</button>
        </>
      )}

      {user && <button onClick={logout}>Logout</button>}
    </div>
  )
}
