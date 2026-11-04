import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { API_URL } from "../api.js";
import ToastContext from "../context/ToastContext.jsx";
import ConfirmContext from "../context/ConfirmContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function Products() {
  const { role, authFetch } = useContext(AuthContext);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [quantityOnHand, setQuantityOnHand] = useState("");
  const [products, setProducts] = useState([]);
  const { showToast } = useContext(ToastContext);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editUnit, setEditUnit] = useState("pcs");
  const [editActive, setEditActive] = useState(true);
  const canWrite = role === "admin" || role === "staff";
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const { confirm } = useContext(ConfirmContext);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  usePageTitle("Products | Inventory");

  async function handleSubmit(e) {
    e.preventDefault();

    const response = await authFetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        name,
        categoryId: categoryId ? Number(categoryId) : undefined,
        unit,
        quantityOnHand: Number(quantityOnHand),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setProducts([...products, data]);
      setSku("");
      setName("");
      setUnit("pcs");
      setQuantityOnHand("");
      showToast("Product added", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  async function handleDelete(id) {
    const ok = await confirm("Are you sure you want to delete this product?");
    if (!ok) return;

    const response = await authFetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      setProducts(products.filter((product) => product.id !== id));
      showToast("Product deleted", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  useEffect(() => {
    async function fetchProducts() {
      const response = await authFetch(`${API_URL}/products`, {
        method: "GET",
      });

      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      } else {
        showToast(data.error, "error");
      }
    }

    fetchProducts();
  }, []);

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

  function handleEdit(product) {
    setEditingId(product.id);
    setEditName(product.name);
    setEditCategoryId(product.categoryId ?? "");
    setEditUnit(product.unit);
    setEditActive(product.isActive);
  }

  async function handleSave(id) {
    const response = await authFetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        categoryId: editCategoryId ? Number(editCategoryId) : null,
        unit: editUnit,
        isActive: editActive,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setProducts(products.map((p) => (p.id === id ? data : p)));
      setEditingId(null);
      showToast("Product updated", "success");
    } else {
      showToast(data.error, "error");
    }
  }

  const filteredProducts = products.filter((p) => {
    const haystack = `${p.sku} ${p.name}`.toLowerCase();
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.every((t) => haystack.includes(t));
  });

  function exportCSV() {
    const headers = ["SKU", "Name", "Category", "Unit", "Quantity", "Active"];

    const rows = filteredProducts.map((p) => [
      p.sku,
      p.name,
      categories.find((c) => c.id === p.categoryId)?.name || "",
      p.unit,
      p.quantityOnHand,
      p.isActive ? "Active" : "Inactive",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
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

  function clearFilters() {
    setSearch("");
  }

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortKey) return 0;

    let aVal = a[sortKey];
    let bVal = b[sortKey];

    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <div className="header-actions">
          <button onClick={exportCSV}>Export CSV</button>
          {canWrite && (
            <button
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Close" : "Add Product"}
            </button>
          )}
        </div>
      </div>

      {canWrite && (
        <div className={showForm ? "form-wrap open" : "form-wrap"}>
          <form onSubmit={handleSubmit}>
            <input
              placeholder="SKU"
              name="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
            />
            <input
              placeholder="Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              value={categoryId}
              name="categoryId"
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={unit}
              name="unit"
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="pcs">pcs</option>
              <option value="box">box</option>
              <option value="kg">kg</option>
            </select>
            <input
              type="number"
              name="quantityOnHand"
              placeholder="Quantity"
              value={quantityOnHand}
              onChange={(e) => setQuantityOnHand(e.target.value)}
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
          placeholder="Search by SKU or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-ghost" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {sortedProducts.length === 0 ? (
        <p className="empty-state">No records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("sku")}>
                SKU {sortKey === "sku" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("name")}>
                Name {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Category</th>
              <th className="sortable" onClick={() => handleSort("unit")}>
                Unit {sortKey === "unit" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("quantityOnHand")}
              >
                Quantity{" "}
                {sortKey === "quantityOnHand"
                  ? sortDir === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("isActive")}>
                Active{" "}
                {sortKey === "isActive" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              {canWrite && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => {
              return (
                <tr key={product.id}>
                  <td className="mono">{product.sku}</td>
                  <td>
                    {editingId === product.id ? (
                      <input
                        value={editName}
                        name="editName"
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      product.name
                    )}
                  </td>
                  <td>
                    {editingId === product.id ? (
                      <select
                        value={editCategoryId}
                        name="editCategoryId"
                        onChange={(e) => setEditCategoryId(e.target.value)}
                      >
                        <option value="">No Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      categories.find((c) => c.id === product.categoryId)
                        ?.name || "-"
                    )}
                  </td>
                  <td>
                    {editingId === product.id ? (
                      <select
                        value={editUnit}
                        name="editUnit"
                        onChange={(e) => setEditUnit(e.target.value)}
                      >
                        <option value="pcs">pcs</option>
                        <option value="box">box</option>
                        <option value="kg">kg</option>
                      </select>
                    ) : (
                      product.unit
                    )}
                  </td>
                  <td className="mono">{product.quantityOnHand}</td>
                  <td>
                    {editingId === product.id ? (
                      <label className="switch">
                        <input
                          type="checkbox"
                          name="editActive"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    ) : (
                      <span
                        className={`badge ${product.isActive ? "badge-green" : "badge-gray"}`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  {canWrite && (
                    <td>
                      {editingId === product.id ? (
                        <>
                          <button onClick={() => handleSave(product.id)}>
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(product)}>
                            Edit
                          </button>

                          {role === "admin" && (
                            <button
                              className="btn-danger"
                              onClick={() => handleDelete(product.id)}
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

export default Products;
