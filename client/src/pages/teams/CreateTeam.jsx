import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeam } from '../../api/teams';
import './CreateTeam.css';

const CreateTeam = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    try {
      await createTeam({ name, description });
      // Redirect to the teams list so the user sees their new team immediately
      navigate('/teams');
    } catch (err) {
      // Fall back to a generic message if the backend didn't send one
      setError(err.response?.data?.message || 'Failed to create team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card create-team-card">
        <h1 className="page-title">Create a New Team</h1>
        <p className="page-subtitle">
          You'll automatically become the admin of this team.
        </p>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="name">Team Name</label>
          <input
            id="name"
            type="text"
            className="input-field"
            placeholder="e.g. Backend Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="field-label" htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            className="input-field textarea-field"
            placeholder="What is this team working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTeam;