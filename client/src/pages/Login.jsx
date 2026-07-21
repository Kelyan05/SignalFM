import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch {
      setError("Incorrect email or password.");
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <form onSubmit={handleLogin}>
          <h1>Welcome to SignalFM</h1>

          <div className="input-box">
            <input
              type="email"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-box password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="btn">Login</button>

          <p style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#1db954" }}>
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
