import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './redux/hooks';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import EmployeeSidebar from './components/layout/EmployeeSidebar';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'Admin') {
    return <Navigate to="/employeesidebar" replace />;
  }
  return children;
};

const HomeRedirect = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Only Admin has access to the full company admin portal
  // Department Supervisors / Managers are employees and use the employee portal
  if (role === 'Admin') {
    return <Navigate to="/sidebar" replace />;
  }
  return <Navigate to="/employeesidebar" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/sidebar"
          element={
            <AdminRoute>
              <Sidebar />
            </AdminRoute>
          }
        />
        <Route
          path="/employeesidebar"
          element={
            <ProtectedRoute>
              <EmployeeSidebar />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;