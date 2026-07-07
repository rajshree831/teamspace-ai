import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrapper component: renders `children` only if the user is authenticated.
// Otherwise redirects to /login.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;