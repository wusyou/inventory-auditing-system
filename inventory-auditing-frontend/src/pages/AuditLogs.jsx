import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { API_URL } from "../api.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

function actionBadge(action) {
  if (action === "CREATE") return "badge-green";
  if (action === "UPDATE") return "badge-blue";
  if (action === "DELETE") return "badge-red";
  return "badge-gray";
}

function formatValue(key, value, categories) {
  if (value === null || value === undefined) {
    return "(none)";
  }

  if (key === "categoryId") {
    const category = categories.find((c) => c.id === value);
    return category ? category.name : `#${value}`;
  }

  return value;
}

const fieldLabels = {
  quantityOnHand: "Quantity on hand",
  categoryId: "Category",
  isActive: "Active",
  name: "Name",
  sku: "SKU",
  unit: "Unit",
  description: "Description",
};

function formatField(key) {
  return fieldLabels[key] || key;
}

const tableLabels = {
  products: "Product",
  categories: "Category",
  stock_movements: "Stock Movement",
  users: "User",
};

function formatTable(tableName) {
  return tableLabels[tableName] || tableName;
}

function describeChange(log, categories) {
  const { action, oldData, newData } = log;

  if (action === "CREATE") {
    return "Created";
  }

  if (action === "DELETE") {
    return "Deleted";
  }

  const skipFields = ["updatedAt"];

  const changes = [];
  for (const key of Object.keys(newData)) {
    if (skipFields.includes(key)) {
      continue;
    }

    if (oldData[key] !== newData[key]) {
      changes.push(
        `${formatField(key)}: ${formatValue(key, oldData[key], categories)} -> ${formatValue(key, newData[key], categories)}`,
      );
    }
  }

  return changes.length > 0 ? changes.join(", ") : "No changes";
}

function AuditLogs() {
  const { authFetch } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  usePageTitle("Audit Logs | Inventory");

  useEffect(() => {
    async function fetchCategories() {
      const response = await authFetch(`${API_URL}/categories`, {
        method: "GET",
      });

      const data = await response.json();
      if (response.ok) {
        setCategories(data);
      }
    }

    fetchCategories();
  }, []);

  async function fetchAuditLogs(term = "") {
    const query = term ? `?search=${encodeURIComponent(term)}` : "";
    const response = await authFetch(`${API_URL}/audit-logs${query}`, {
      method: "GET",
    });

    const data = await response.json();
    if (response.ok) {
      setLogs(data);
    } else {
      showToast(data.error, "error");
    }
  }

  function clearFilters() {
    setSearch("");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  async function exportCSV() {
    const response = await authFetch(`${API_URL}/audit-logs/export`, {
      method: "GET",
    });

    if (!response.ok) {
      showToast("Export failed", "error");
      return;
    }

    const csv = await response.text();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getSortValue(log, key) {
    if (key === "user") return log.changedBy?.fullName;
    return log[key];
  }

  const sortedLogs = [...logs].sort((a, b) => {
    if (!sortKey) return 0;

    let aVal = getSortValue(a, sortKey);
    let bVal = getSortValue(b, sortKey);

    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Audit Logs</h1>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          className="search-input"
          placeholder="Search by table, action, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-ghost" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {sortedLogs.length === 0 ? (
        <p className="empty-state">No records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("changedAt")}>
                Date & Time{" "}
                {sortKey === "changedAt" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("user")}>
                User {sortKey === "user" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("action")}>
                Action{" "}
                {sortKey === "action" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("tableName")}>
                Table{" "}
                {sortKey === "tableName" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("recordId")}>
                Record ID{" "}
                {sortKey === "recordId" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.changedAt).toLocaleString()}</td>
                <td>{log.changedBy?.fullName || "System"}</td>
                <td>
                  <span className={`badge ${actionBadge(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td>{formatTable(log.tableName)}</td>
                <td>{log.recordId}</td>
                <td>{describeChange(log, categories)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AuditLogs;
