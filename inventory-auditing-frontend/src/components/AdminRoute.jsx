import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";

function AdminRoute({ children }) {
  const { role } = useContext(AuthContext);

  if (role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default AdminRoute;
