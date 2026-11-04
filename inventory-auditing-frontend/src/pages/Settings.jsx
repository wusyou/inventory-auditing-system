import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext.jsx";
import ToastContext from "../context/ToastContext.jsx";
import ThemeContext from "../context/ThemeContext.jsx";
import { API_URL } from "../api.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmContext from "../context/ConfirmContext.jsx";

function roleBadge(role) {
  if (role === "admin") return "badge-blue";
  if (role === "auditor") return "badge-amber";
  return "badge-gray";
}

function Settings() {
  usePageTitle("Settings | Inventory");

  const { authFetch, setToken } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [account, setAccount] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const { confirm } = useContext(ConfirmContext);
  const navigate = useNavigate();

  async function handleLogoutAll() {
    const ok = await confirm(
      "Log out from all devices? You will need to log in again.",
    );
    if (!ok) return;

    await authFetch(`${API_URL}/users/logout-all`, { method: "POST" });
    setToken(null);
    navigate("/login");
  }

  function show(field) {
    setVisible((v) => ({ ...v, [field]: true }));
  }

  function hide(field) {
    setVisible((v) => ({ ...v, [field]: false }));
  }

  useEffect(() => {
    async function fetchAccount() {
      const response = await authFetch(`${API_URL}/users/me`, {
        method: "GET",
      });
      if (response.ok) {
        setAccount(await response.json());
      }
    }

    fetchAccount();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    const response = await authFetch(`${API_URL}/users/change-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (response.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  return (
    <div>
      <h1>Settings</h1>

      <div className="settings-card">
        <h3>Account</h3>
        {account && (
          <div className="account-info">
            <div className="account-row">
              <span className="account-label">Name</span>
              <span>{account.fullName}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Email</span>
              <span>{account.email}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Role</span>
              <span className={`badge ${roleBadge(account.role)}`}>
                {account.role}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="settings-card">
        <h3>Appearance</h3>
        <div className="account-row">
          <span className="account-label">Dark mode</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3>Change Password</h3>
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="input-wrap">
            <input
              type={visible.current ? "text" : "password"}
              name="currentPassword"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            {currentPassword && (
              <button
                type="button"
                className="eye-btn"
                onMouseDown={() => show("current")}
                onMouseUp={() => hide("current")}
                onMouseLeave={() => hide("current")}
                onTouchStart={() => show("current")}
                onTouchEnd={() => hide("current")}
              >
                {visible.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>

          <div className="input-wrap">
            <input
              type={visible.newPass ? "text" : "password"}
              name="newPassword"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {newPassword && (
              <button
                type="button"
                className="eye-btn"
                onMouseDown={() => show("newPass")}
                onMouseUp={() => hide("newPass")}
                onMouseLeave={() => hide("newPass")}
                onTouchStart={() => show("newPass")}
                onTouchEnd={() => hide("newPass")}
              >
                {visible.newPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>

          <div className="input-wrap">
            <input
              type={visible.confirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && (
              <button
                type="button"
                className="eye-btn"
                onMouseDown={() => show("confirm")}
                onMouseUp={() => hide("confirm")}
                onMouseLeave={() => hide("confirm")}
                onTouchStart={() => show("confirm")}
                onTouchEnd={() => hide("confirm")}
              >
                {visible.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>

          <button type="submit" className="btn-primary">
            Change Password
          </button>
        </form>
      </div>
      <div className="settings-card">
        <h3>Sessions</h3>
        <p className="account-label" style={{ marginBottom: "12px" }}>
          Log out from all devices where your account is signed in.
        </p>
        <button className="btn-danger" onClick={handleLogoutAll}>
          Log out all devices
        </button>
      </div>
    </div>
  );
}

export default Settings;
