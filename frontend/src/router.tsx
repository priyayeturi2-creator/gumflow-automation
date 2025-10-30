import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ContentDashboard from './pages/ContentDashboard';
import About from './pages/About';
import FlowList from './pages/FlowList';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/content-dashboard-flow-list',
    element: (
      <ProtectedRoute>
        <FlowList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: '/content-dashboard',
    element: (
      <ProtectedRoute>
        <ContentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/content-dashboard/:runId',
    element: (
      <ProtectedRoute>
        <ContentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard/content',
    element: (
      <ProtectedRoute>
        <ContentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);