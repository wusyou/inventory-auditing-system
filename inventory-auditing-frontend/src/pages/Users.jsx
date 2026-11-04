import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { API_URL } from "../api.js";
import ToastContext from "../context/ToastContext.jsx";
import ConfirmContext from "../context/ConfirmContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { Eye, EyeOff } from "lucide-react";

function roleBadge(role) {
  if (role === "admin") return "badge-blue";
  if (role === "auditor") return "badge-amber";
  return "badge-gray";
}

function Users() {
  const [users, setUsers] = useState([]);
  const { userId, authFetch } = useContext(AuthContext);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const { showToast } = useContext(ToastContext);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const { confirm } = useContext(ConfirmContext);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  usePageTitle("Users | Inventory");

  async function fetchUsers() {
    const response = await authFetch(`${API_URL}/users`, {
      method: "GET",
    });

    const data = await response.json();

    if (response.ok) {
      setUsers(data);
    } else {
      showToast(data.error, "error");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function clearFilters() {
    setSearch("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const response = await authFetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      fetchUsers();
      showToast("User added", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  async function handleDeactivate(id) {
    const ok = await confirm("Are you sure you want to deactivate this user?");
    if (!ok) return;

    const response = await authFetch(`${API_URL}/users/${id}/deactivate`, {
      method: "PATCH",
    });

    const data = await response.json();

    if (response.ok) {
      fetchUsers();
      showToast("User deactivated", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  async function handleActivate(id) {
    const response = await authFetch(`${API_URL}/users/${id}/activate`, {
      method: "PATCH",
    });

    const data = await response.json();

    if (response.ok) {
      fetchUsers();
      showToast("User activated", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  async function handleRoleChange(id, newRole) {
    const ok = await confirm(`Change this user's role to "${newRole}"?`);
    if (!ok) return;

    const response = await authFetch(`${API_URL}/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    const data = await response.json();

    if (response.ok) {
      fetchUsers();
      showToast("Role updated", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  const filteredUsers = users.filter((u) => {
    const haystack = `${u.fullName} ${u.email} ${u.role}`.toLowerCase();
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.every((t) => haystack.includes(t));
  });

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortKey) return 0;

    let aVal = a[sortKey];
    let bVal = b[sortKey];

    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  async function handleResetPassword() {
    if (resetPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    const response = await authFetch(
      `${API_URL}/users/${resetUserId}/reset-password`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      },
    );

    const data = await response.json();

    if (response.ok) {
      showToast("Password reset", "success");
      setResetUserId(null);
      setResetPassword("");
    } else {
      showToast(data.error, "error");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "Add User"}
        </button>
      </div>

      <div className={showForm ? "form-wrap open" : "form-wrap"}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="staff">Staff</option>
            <option value="auditor">Auditor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          className="search-input"
          placeholder="Search by name, email, or role.."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-ghost" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {sortedUsers.length === 0 ? (
        <p className="empty-state">No records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("id")}>
                ID {sortKey === "id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("fullName")}>
                Full Name{" "}
                {sortKey === "fullName" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("email")}>
                Email{" "}
                {sortKey === "email" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("role")}>
                Role {sortKey === "role" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("isActive")}>
                Status{" "}
                {sortKey === "isActive" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  {user.id === userId ? (
                    <span className={`badge ${roleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                    >
                      <option value="staff">Staff</option>
                      <option value="auditor">Auditor</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${user.isActive ? "badge-green" : "badge-gray"}`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  {user.id === userId ? null : (
                    <>
                      {user.isActive ? (
                        <button
                          className="btn-danger"
                          onClick={() => handleDeactivate(user.id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(user.id)}>
                          Activate
                        </button>
                      )}
                      <button onClick={() => setResetUserId(user.id)}>
                        Reset Password
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {resetUserId && (
        <div className="modal-overlay" onClick={() => setResetUserId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-message">Set a new password for this user:</p>
            <input
              type="password"
              placeholder="New password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setResetUserId(null);
                  setResetPassword("");
                }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleResetPassword}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
