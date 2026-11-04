import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { API_URL } from "../api.js";
import ToastContext from "../context/ToastContext.jsx";
import ConfirmContext from "../context/ConfirmContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function Categories() {
  const { role, authFetch } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const canWrite = role === "admin" || role === "staff";
  const { showToast } = useContext(ToastContext);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const { confirm } = useContext(ConfirmContext);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  usePageTitle("Categories | Inventory");

  async function handleSubmit(e) {
    e.preventDefault();

    const response = await authFetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setCategories([...categories, data]);
      setName("");
      setDescription("");
      showToast("Category added", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  async function handleDelete(id) {
    const ok = await confirm("Are you sure you want to delete this category?");
    if (!ok) return;

    const response = await authFetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      setCategories(categories.filter((category) => category.id !== id));
      showToast("Category deleted", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  useEffect(() => {
    async function fetchCategories() {
      const response = await authFetch(`${API_URL}/categories`, {
        method: "GET",
      });

      const data = await response.json();
      if (response.ok) {
        setCategories(data);
      } else {
        showToast(data.error, "error");
      }
    }

    fetchCategories();
  }, []);

  function handleEdit(category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || "");
  }

  async function handleSave(id) {
    const response = await authFetch(`${API_URL}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setCategories(categories.map((c) => (c.id === id ? data : c)));
      setEditingId(null);
      showToast("Category updated", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  const filteredCategories = categories.filter((c) => {
    const haystack = `${c.name} ${c.description || ""}`.toLowerCase();
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.every((t) => haystack.includes(t));
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!sortKey) return 0;

    let aVal = a[sortKey];
    let bVal = b[sortKey];

    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function clearFilters() {
    setSearch("");
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Categories</h1>
        {canWrite && (
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close" : "Add Category"}
          </button>
        )}
      </div>
      {canWrite && (
        <div className={showForm ? "form-wrap open" : "form-wrap"}>
          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              name="description"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Add
            </button>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          className="search-input"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-ghost" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="empty-state">No records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("id")}>
                id {sortKey === "id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("name")}>
                name {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category) => {
              return (
                <tr key={category.id}>
                  <td className="mono">{category.id}</td>
                  <td>
                    {editingId === category.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td>
                    {editingId === category.id ? (
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    ) : (
                      category.description || "-"
                    )}
                  </td>
                  {canWrite && (
                    <td>
                      {editingId === category.id ? (
                        <>
                          <button onClick={() => handleSave(category.id)}>
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(category)}>
                            Edit
                          </button>

                          {role === "admin" && (
                            <button
                              className="btn-danger"
                              onClick={() => handleDelete(category.id)}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Categories;
