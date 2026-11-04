import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext.jsx";
import ToastContext from "../context/ToastContext.jsx";
import { API_URL } from "../api.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

function LoginAttempts() {
  usePageTitle("Login Attempts | Inventory");

  const { authFetch } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [attempts, setAttempts] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function fetchAttempts() {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status !== "all") params.append("status", status);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await authFetch(
      `${API_URL}/login-attempts?${params.toString()}`,
      { method: "GET" },
    );

    const data = await response.json();
    if (response.ok) {
      setAttempts(data);
    } else {
      showToast(data.error, "error");
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setFrom("");
    setTo("");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttempts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, from, to]);

  return (
    <div>
      <h1>Login Attempts</h1>

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          className="search-input"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <label className="date-field">
          <span>From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="date-field">
          <span>To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button className="btn-ghost" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {attempts.length === 0 ? (
        <p className="empty-state">No records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Email</th>
              <th>Status</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>{a.email}</td>
                <td>
                  <span
                    className={`badge ${a.success ? "badge-green" : "badge-red"}`}
                  >
                    {a.success ? "Success" : "Failed"}
                  </span>
                </td>
                <td className="mono">{a.ipAddress || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LoginAttempts;
