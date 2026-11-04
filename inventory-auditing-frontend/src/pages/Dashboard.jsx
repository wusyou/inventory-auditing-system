import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext.jsx";
import { API_URL } from "../api.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useNavigate } from "react-router-dom";
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

function actionBadge(action) {
  if (action === "CREATE") return "badge-green";
  if (action === "UPDATE") return "badge-blue";
  if (action === "DELETE") return "badge-red";
  return "badge-gray";
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

function Dashboard() {
  const { role, authFetch } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [range, setRange] = useState("30d");
  const [recentMovements, setRecentMovements] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const navigate = useNavigate();
  const deltas = stats?.deltas || {};

  usePageTitle("Dashboard | Inventory");

  useEffect(() => {
    async function fetchStats() {
      const response = await authFetch(
        `${API_URL}/dashboard/stats?range=${range}`,
        { method: "GET" },
      );
      if (response.ok) {
        setStats(await response.json());
      }
    }

    fetchStats();
  }, [range]);

  useEffect(() => {
    async function fetchRecent() {
      const mRes = await authFetch(`${API_URL}/stock-movements?limit=5`, {
        method: "GET",
      });
      if (mRes.ok) {
        setRecentMovements(await mRes.json());
      }

      if (role === "admin") {
        const aRes = await authFetch(`${API_URL}/audit-logs?limit=5`, {
          method: "GET",
        });
        if (aRes.ok) {
          setRecentAudit(await aRes.json());
        }
      }
    }

    fetchRecent();
  }, []);

  const counts = stats?.counts || {};
  const stockByCategory = stats?.stockByCategory || [];
  const lowStockItems = stats?.lowStockItems || [];
  const timeSeries = stats?.timeSeries || [];
  const loading = stats === null;

  const donutData = (stats?.movementByType || []).map((m) => ({
    name: movementLabel(m.type),
    value: m.count,
  }));
  const movementColors = ["var(--green)", "var(--red)", "var(--amber)"];

  const tooltipStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stat-grid">
        <div className="stat-card" onClick={() => navigate("/products")}>
          <p className="stat-label">Total Products</p>
          <p className="stat-value">
            {loading ? (
              <span className="skeleton skeleton-value" />
            ) : (
              (counts.totalProducts ?? 0)
            )}
          </p>
          {!loading && (
            <p className="stat-delta">+{deltas.newProducts ?? 0} this week</p>
          )}
        </div>
        <div className="stat-card" onClick={() => navigate("/products")}>
          <p className="stat-label">Low Stock</p>
          <p className="stat-value">
            {loading ? (
              <span className="skeleton skeleton-value" />
            ) : (
              (counts.lowStock ?? 0)
            )}
          </p>
        </div>
        <div className="stat-card" onClick={() => navigate("/products")}>
          <p className="stat-label">Out of Stock</p>
          <p className="stat-value">
            {loading ? (
              <span className="skeleton skeleton-value" />
            ) : (
              (counts.outOfStock ?? 0)
            )}
          </p>
        </div>

        <div className="stat-card" onClick={() => navigate("/categories")}>
          <p className="stat-label">Categories</p>
          <p className="stat-value">
            {loading ? (
              <span className="skeleton skeleton-value" />
            ) : (
              (counts.totalCategories ?? 0)
            )}
          </p>
          {!loading && (
            <p className="stat-delta">+{deltas.newCategories ?? 0} this week</p>
          )}
        </div>

        <div className="stat-card" onClick={() => navigate("/stock-movements")}>
          <p className="stat-label">Stock Movements</p>
          <p className="stat-value">
            {loading ? (
              <span className="skeleton skeleton-value" />
            ) : (
              (counts.totalMovements ?? 0)
            )}
          </p>
          {!loading && (
            <p className="stat-delta">+{deltas.newMovements ?? 0} this week</p>
          )}
        </div>
      </div>

      <div className="chart-card">
        <h3>Stock by Category</h3>
        {loading ? (
          <div
            className="skeleton chart-skeleton"
            style={{ height: Math.max(260, stockByCategory.length * 56) }}
          />
        ) : stockByCategory.length === 0 ? (
          <p className="chart-empty">No categories yet.</p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(260, stockByCategory.length * 56)}
          >
            <BarChart
              data={stockByCategory}
              layout="vertical"
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                stroke="var(--text-muted)"
                fontSize={12}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={12}
                width={130}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="stock"
                fill="var(--primary)"
                radius={[0, 6, 6, 0]}
                barSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="section-bar">
        <h3 className="section-title">Movement Activity</h3>
        <select
          className="range-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last 12 months</option>
        </select>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Movement Types</h3>

          {loading ? (
            <div className="skeleton chart-skeleton" style={{ height: 280 }} />
          ) : donutData.every((d) => d.value === 0) ? (
            <p className="chart-empty">No movements in this range.</p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(260, stockByCategory.length * 56)}
            >
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={index} fill={movementColors[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Stock In vs Out Over Time</h3>

          {loading ? (
            <div className="skeleton chart-skeleton" style={{ height: 280 }} />
          ) : timeSeries.length === 0 ? (
            <p className="chart-empty">No movements in this range.</p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(260, stockByCategory.length * 56)}
            >
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="period"
                  stroke="var(--text-muted)"
                  fontSize={12}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="stockIn"
                  name="Stock In"
                  stroke="var(--green)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="stockOut"
                  name="Stock Out"
                  stroke="var(--red)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <h3 className="section-title">Low Stock Items</h3>
      {lowStockItems.length === 0 ? (
        <p className="empty-state">No low stock items. All good.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.sku}</td>
                <td>{p.name}</td>
                <td className="mono">{p.quantityOnHand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="chart-grid">
        <div>
          <h3 className="section-title">Recent Movements</h3>
          {recentMovements.length === 0 ? (
            <p className="empty-state">No recent movements.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td>{m.product?.name || "-"}</td>
                    <td>
                      <span
                        className={`badge ${movementBadge(m.movementType)}`}
                      >
                        {movementLabel(m.movementType)}
                      </span>
                    </td>
                    <td className="mono">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {role === "admin" && (
          <div>
            <h3 className="section-title">Recent Audit Logs</h3>
            {recentAudit.length === 0 ? (
              <p className="empty-state">No recent audit logs.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Table</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudit.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.changedAt).toLocaleDateString()}</td>
                      <td>{log.changedBy?.fullName || "System"}</td>
                      <td>
                        <span className={`badge ${actionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{formatTable(log.tableName)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
