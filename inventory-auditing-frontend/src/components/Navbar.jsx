import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext.jsx";
import { API_URL } from "../api.js";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowRightLeft,
  ScrollText,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Settings,
  ShieldAlert,
} from "lucide-react";

function Navbar() {
  const { role, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("collapsed") === "true",
  );

  useEffect(() => {
    localStorage.setItem("collapsed", collapsed);
  }, [collapsed]);

  function toggleCollapse() {
    setCollapsed(!collapsed);
  }

  async function handleLogout() {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    setToken(null);
    navigate("/login");
  }

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="sidebar-top">
        <div className="sidebar-logo">Inventory</div>
        <button
          className="collapse-btn"
          onClick={toggleCollapse}
          data-tooltip={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-group">Main</p>
        <NavLink
          to="/dashboard"
          data-tooltip="Dashboard"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/products"
          data-tooltip="Products"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <Package size={18} />
          <span>Products</span>
        </NavLink>
        <NavLink
          to="/categories"
          data-tooltip="Categories"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <Tags size={18} />
          <span>Categories</span>
        </NavLink>
        <NavLink
          to="/stock-movements"
          data-tooltip="Stock Movements"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <ArrowRightLeft size={18} />
          <span>Stock Movements</span>
        </NavLink>

        {role === "admin" && (
          <>
            <p className="sidebar-group">Admin</p>
            <NavLink
              to="/audit-logs"
              data-tooltip="Audit Logs"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <ScrollText size={18} />
              <span>Audit Logs</span>
            </NavLink>
            <NavLink
              to="/users"
              data-tooltip="Users"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Users size={18} />
              <span>Users</span>
            </NavLink>
            <NavLink
              to="/login-attempts"
              data-tooltip="Login Attempts"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <ShieldAlert size={18} />
              <span>Login Attempts</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          data-tooltip="Settings"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

        <button
          className="logout-btn"
          onClick={handleLogout}
          data-tooltip="Logout"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
