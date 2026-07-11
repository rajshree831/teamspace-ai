import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyTeams } from '../../api/teams';
import { useAuth } from '../../context/AuthContext';
import './MyTeams.css';

const MyTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getMyTeams();
        setTeams(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return <div className="container"><p className="status-text">Loading teams...</p></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Teams</h1>
          <p className="page-subtitle">Teams you're a part of</p>
        </div>
        <Link to="/teams/create" className="btn btn-primary">+ Create Team</Link>
      </div>

      {error && <div className="error-text">{error}</div>}

      {teams.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-title">No teams yet</p>
          <p className="empty-subtitle">Create your first team to get started.</p>
          <Link to="/teams/create" className="btn btn-primary">Create a Team</Link>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map((team) => {
            // Find the logged-in user's own membership entry to show their role.
            const myMembership = team.members.find((m) => m.user === user._id);
            const myRole = myMembership?.role || 'member';

            return (
              <Link to={`/teams/${team._id}`} key={team._id} className="team-card card">
                <div className="team-card-header">
                  <h3 className="team-name">{team.name}</h3>
                  <span className={`badge ${myRole === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                    {myRole}
                  </span>
                </div>
                <p className="team-description">
                  {team.description || 'No description provided'}
                </p>
                <p className="team-meta">
                  {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTeams;