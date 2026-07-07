import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user?.name || "User"}</h2>
      <p>Email: {user?.email}</p>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;