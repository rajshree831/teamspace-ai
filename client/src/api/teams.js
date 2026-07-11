import axiosInstance from './axiosInstance';

// Create a new team
export const createTeam = async (teamData) => {
  const response = await axiosInstance.post('/teams', teamData);
  return response.data;
};

// Get all teams the logged-in user belongs to
export const getMyTeams = async () => {
  const response = await axiosInstance.get('/teams/my');
  return response.data;
};

// Get details of a single team (populated members)
export const getTeamById = async (teamId) => {
  const response = await axiosInstance.get(`/teams/${teamId}`);
  return response.data;
};

// Add a member to a team by email (admin only)
export const addMember = async (teamId, email) => {
  const response = await axiosInstance.post(`/teams/${teamId}/members`, { email });
  return response.data;
};