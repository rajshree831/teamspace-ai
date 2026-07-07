import axiosInstance from "./axiosInstance";

// Calls POST /api/auth/register
// Returns the backend response data (user + token) on success.
// Throws the error up to the caller (Register.jsx) to handle UI feedback.
export const registerUser = async (name, email, password) => {
  const response = await axiosInstance.post("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
};

// Calls POST /api/auth/login
export const loginUser = async (email, password) => {
  const response = await axiosInstance.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};