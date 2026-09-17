import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Components/Register';
import Login from './Components/Login';
import Sidebar from './Components/Sidebar';
import EmployeeSidebar from './Components/EmployeeSidebar';
import HrSidebar from './Components/HrSidebar';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const HomeRedirect = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  const department = localStorage.getItem('userDepartment');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'Manager' || role === 'Admin') {
    return <Navigate to="/sidebar" replace />;
  }
  if (department === 'Human Resources') {
    return <Navigate to="/hrsidebar" replace />;
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
            <ProtectedRoute>
              <Sidebar />
            </ProtectedRoute>
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
        <Route
          path="/hrsidebar"
          element={
            <ProtectedRoute>
              <HrSidebar />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;