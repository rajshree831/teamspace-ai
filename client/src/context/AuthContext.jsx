import { createContext, useContext, useState, useEffect } from "react";

// 1. Create the context object.
// This is just a "channel" — it holds no logic itself.
const AuthContext = createContext();

// 2. Custom hook for consuming the context.
// Lets components do `const { user, login } = useAuth()`
// instead of `useContext(AuthContext)` every time.
export const useAuth = () => useContext(AuthContext);

// 3. Provider component — wraps the whole app.
// Holds the real state and the functions that update it.
export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage so a page refresh
  // doesn't log the user out.
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // login: called after a successful register/login API call.
  // Takes the user object and token returned by the backend.
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  // logout: clears everything, both in state and storage.
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // isAuthenticated: a derived convenience value.
  // Components can check this instead of re-deriving it themselves.
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};