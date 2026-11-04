import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { API_URL } from "../api.js";
import ToastContext from "../context/ToastContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function movementBadge(type) {
  if (type === "stock_in") return "badge-green";
  if (type === "stock_out") return "badge-red";
  return "badge-amber";
}

function movementLabel(type) {
  if (type === "stock_in") return "Stock In";
  if (type === "stock_out") return "Stock Out";
  return "Adjustment";
}

function clearFilters() {
  setSearch("");
}

function StockMovements() {
  const { role, authFetch } = useContext(AuthContext);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [movementType, setMovementType] = useState("stock_in");
  const [quantity, setQuantity] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [reason, setReason] = useState("");
  const canWrite = role === "admin" || role === "staff";
  const { showToast } = useContext(ToastContext);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  usePageTitle("Stock Movements | Inventory");

  async function fetchStockMovements(term = "") {
    const query = term ? `?search=${encodeURIComponent(term)}` : "";
    const response = await authFetch(`${API_URL}/stock-movements${query}`, {
      method: "GET",
    });

    const data = await response.json();
    if (response.ok) {
      setMovements(data);
    } else {
      showToast(data.error, "error");
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStockMovements(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

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

  async function handleSubmit(e) {
    e.preventDefault();

    const response = await authFetch(`${API_URL}/stock-movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: Number(productId),
        movementType,
        quantity: Number(quantity),
        referenceNo: referenceNo || undefined,
        reason: reason || undefined,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setProductId("");
      setMovementType("stock_in");
      setQuantity("");
      setReferenceNo("");
      setReason("");
      showToast("Stock Movement added", "success");
      fetchStockMovements();
    } else {
      showToast(data.error, "error");
    }

    fetchStockMovements(search);
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getSortValue(m, key) {
    if (key === "sku") return m.product?.sku;
    if (key === "product") return m.product?.name;
    return m[key];
  }

  const sortedMovements = [...movements].sort((a, b) => {
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
        <h1>Stock Movements</h1>
        {canWrite && (
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close" : "Add Stock Movement"}
          </button>
        )}
      </div>

      {canWrite && (
        <div className={showForm ? "form-wrap open" : "form-wrap"}>
          <form onSubmit={handleSubmit}>
            <select
              value={productId}
              name="productId"
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
            <select
              value={movementType}
              name="movementType"
              onChange={(e) => setMovementType(e.target.value)}
            >
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <input
              type="number"
              name="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <input
              placeholder="Reference No (optional)"
              name="referenceNo"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
            <input
              placeholder="Reason (optional)"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
          placeholder="Search by product, SKU, reference, or reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-ghost" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {sortedMovements.length === 0 ? (
        <p className="empty-state">No records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("createdAt")}>
                Date & Time{" "}
                {sortKey === "createdAt" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("sku")}>
                SKU {sortKey === "sku" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("product")}>
                Product{" "}
                {sortKey === "product" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("movementType")}
              >
                Type{" "}
                {sortKey === "movementType"
                  ? sortDir === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th className="sortable" onClick={() => handleSort("quantity")}>
                Quantity{" "}
                {sortKey === "quantity" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Reference</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {sortedMovements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>{m.product.sku}</td>
                <td>{m.product.name}</td>
                <td>
                  <span className={`badge ${movementBadge(m.movementType)}`}>
                    {movementLabel(m.movementType)}
                  </span>
                </td>
                <td>{m.quantity}</td>
                <td>{m.referenceNo || "-"}</td>
                <td>{m.reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StockMovements;
