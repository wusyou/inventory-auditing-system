import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";

function PublicRoute({ children }) {
  const { loading, token } = useContext(AuthContext);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;
