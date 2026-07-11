import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

// Wrapper component: renders `children` only if the user is authenticated.
// Otherwise redirects to /login. Also renders a persistent Navbar
// above the page content, so every protected page gets navigation
// automatically without repeating it per-page.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default ProtectedRoute;