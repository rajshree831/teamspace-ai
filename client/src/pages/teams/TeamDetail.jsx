import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeamById, addMember } from '../../api/teams';
import { useAuth } from '../../context/AuthContext';
import './TeamDetail.css';

const TeamDetail = () => {
  const { id } = useParams(); // team id from the URL
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add-member form state
  const [email, setEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await getTeamById(id);
        setTeam(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id]); // re-fetch if the id in the URL ever changes

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!email.trim()) {
      setAddError('Email is required');
      return;
    }

    setAdding(true);
    try {
      const updatedTeam = await addMember(id, email);
      setTeam(updatedTeam); // backend returns the full updated team — use it directly
      setEmail('');
      setAddSuccess('Member added successfully');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="container"><p className="status-text">Loading team...</p></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-text">{error}</div>
        <Link to="/teams" className="btn btn-primary">Back to My Teams</Link>
      </div>
    );
  }

  // Determine if the logged-in user is an admin of THIS team.
  // team.members[i].user is a populated object here ({ _id, name, email }),
  // unlike MyTeams.jsx where it was just a raw id string.
  const myMembership = team.members.find((m) => m.user._id === user._id);
  const isAdmin = myMembership?.role === 'admin';

  return (
    <div className="container">
      <Link to="/teams" className="back-link">← Back to My Teams</Link>

      <div className="card team-header-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">{team.name}</h1>
            <p className="page-subtitle">{team.description || 'No description provided'}</p>
          </div>
          {isAdmin && <span className="badge badge-admin">Admin</span>}
        </div>

        <Link to={`/teams/${team._id}/board`} className="btn btn-primary">
  Go to Kanban Board
</Link>
      </div>

      <div className="card">
        <h2 className="section-title">Members ({team.members.length})</h2>
        <ul className="member-list">
          {team.members.map((m) => (
            <li key={m.user._id} className="member-item">
              <div>
                <p className="member-name">{m.user.name}</p>
                <p className="member-email">{m.user.email}</p>
              </div>
              <span className={`badge ${m.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div className="card">
          <h2 className="section-title">Add Member</h2>
          <p className="section-subtitle">
            Add a member by their registered email. They must already have an account.
          </p>

          {addError && <div className="error-text">{addError}</div>}
          {addSuccess && <div className="success-text">{addSuccess}</div>}

          <form onSubmit={handleAddMember} className="add-member-form">
            <input
              type="email"
              className="input-field"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;