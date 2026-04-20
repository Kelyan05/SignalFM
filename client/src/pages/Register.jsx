import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/Login.css";

// Each one maps to a specific commitment made in the submission.
const CONSENT_ITEMS = [
  "I understand this platform is an academic research prototype built at the University of Westminster.",
  "I understand my interaction data (likes, plays, skips) is used only to generate personalised recommendations within this platform and not shared with third parties.",
  "I understand I can withdraw from using this platform at any time by deleting my account.",
  "I confirm I am 18 years of age or older.",
];

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consents, setConsents] = useState(CONSENT_ITEMS.map(() => false));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const allConsented = consents.every(Boolean);

  const toggleConsent = (index) => {
    setConsents((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!allConsented) {
      setError("Please agree to all statements before registering.");
      return;
    }

    setSubmitting(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper" style={{ maxWidth: 480 }}>
        <form onSubmit={handleRegister}>
          <h1>Create Account</h1>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
            SignalFM is an academic research prototype developed at the
            University of Westminster.
          </p>

          <div className="input-box">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-box password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 6 characters)"
              value={password}
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

          <div className="input-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Informed consent section — required by ethics form Section 5 */}
          <div style={{ margin: "20px 0", textAlign: "left" }}>
            <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
              Before registering, please read and agree to the following:
            </p>

            {CONSENT_ITEMS.map((item, index) => (
              <label
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 12,
                  cursor: "pointer",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#ccc",
                }}
              >
                <input
                  type="checkbox"
                  checked={consents[index]}
                  onChange={() => toggleConsent(index)}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                {item}
              </label>
            ))}
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            className="btn"
            type="submit"
            disabled={submitting || !allConsented}
            style={{ opacity: !allConsented ? 0.5 : 1 }}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#1db954" }}>
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
