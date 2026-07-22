import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import MyTeams from "./pages/teams/MyTeams";
import CreateTeam from "./pages/teams/CreateTeam";
import TeamDetail from "./pages/teams/TeamDetail";
import KanbanBoard from "./pages/kanban/KanbanBoard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected route — only reachable if logged in */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected team routes */}
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <MyTeams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/create"
            element={
              <ProtectedRoute>
                <CreateTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <ProtectedRoute>
                <TeamDetail />
              </ProtectedRoute>
            }
          />
          <Route
  path="/teams/:id/board"
  element={
    <ProtectedRoute>
      <KanbanBoard />
    </ProtectedRoute>
  }
/>

          {/* Default route: redirect root ("/") to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Catch-all: unknown routes also go to login for now */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;