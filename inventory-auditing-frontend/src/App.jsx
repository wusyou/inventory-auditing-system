import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/Protected.jsx";
import Products from "./pages/Products.jsx";
import Layout from "./components/Layout.jsx";
import Categories from "./pages/Categories.jsx";
import StockMovements from "./pages/StockMovements.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Users from "./pages/Users.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Settings from "./pages/Settings.jsx";
import LoginAttempts from "./pages/LoginAttempts.jsx";
import PublicRoute from "./components/PublicRoute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/stock-movements" element={<StockMovements />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/audit-logs"
          element={
            <AdminRoute>
              <AuditLogs />
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="/login-attempts"
          element={
            <AdminRoute>
              <LoginAttempts />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
