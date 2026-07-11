import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getMyTeams } from "../../api/teams";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getMyTeams();
        setTeams(data);
      } catch (err) {
        // Non-critical for the dashboard — fail silently and just show 0 teams
        console.error("Failed to load teams summary:", err.message);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Welcome, {user?.name || "User"}</h2>
          <p className="page-subtitle">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>

      <div className="card">
        <div className="page-header">
          <h3 className="section-title">Your Teams</h3>
          <Link to="/teams/create" className="btn btn-primary">+ Create Team</Link>
        </div>

        {loadingTeams ? (
          <p className="status-text">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="empty-subtitle">
            You're not part of any team yet. Create one to get started.
          </p>
        ) : (
          <>
            <ul className="dashboard-team-list">
              {teams.slice(0, 3).map((team) => (
                <li key={team._id}>
                  <Link to={`/teams/${team._id}`} className="dashboard-team-link">
                    {team.name}
                    <span className="team-meta">
                      {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/teams" className="view-all-link">
              View all teams ({teams.length}) →
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;