import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";
import { API_URL } from "../api.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  usePageTitle("Login | Inventory");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        navigate("/dashboard");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Cannot connect to the server. Please try again.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Login</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && (
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
