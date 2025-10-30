import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ContentDashboard from './pages/ContentDashboard';
import Home from './pages/Home';
import FlowList from './pages/FlowList';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/content-dashboard" element={<ContentDashboard />} />
        <Route path="/content-dashboard/:runId" element={<ContentDashboard />} />
        <Route path="/content-dashboard-flow-list" element={<FlowList />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
