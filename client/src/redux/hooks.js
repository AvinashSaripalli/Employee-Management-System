import { useDispatch, useSelector } from 'react-redux';
import {
  setCredentials,
  updateUserProfile,
  logout,
  selectCurrentUser,
  selectCurrentToken,
  selectIsAuthenticated,
  selectUserRole,
  selectDepartmentRole,
  selectCompanyName,
  selectEmployeeId,
} from './slices/authSlice';
import {
  selectBadgeCounts,
  selectSelectedComponent,
  selectIsSidebarCollapsed,
  setSelectedComponent,
  toggleSidebar,
  setBadgeCounts,
  updateSingleBadgeCount,
} from './slices/uiSlice';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);
  const departmentRole = useSelector(selectDepartmentRole);
  const companyName = useSelector(selectCompanyName);
  const employeeId = useSelector(selectEmployeeId);

  const normalizedRole = String(role || '').toLowerCase();
  const normalizedDeptRole = String(departmentRole || '').toLowerCase();
  const normalizedDept = String(user?.department || '').toLowerCase();

  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'hr';
  const isSupervisor = normalizedDeptRole === 'supervisor' || normalizedRole === 'manager';
  const isITStaff = normalizedDept.includes('it') || normalizedDept.includes('tech') || normalizedRole === 'it';
  const isStaff = isAdmin || isSupervisor || isITStaff;
  const canManageSettings = isAdmin || isSupervisor || normalizedRole === 'manager';

  return {
    user,
    token,
    isAuthenticated,
    role,
    departmentRole,
    companyName,
    employeeId,
    department: user?.department || '',
    designation: user?.designation || '',
    photo: user?.photo || null,
    name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
    email: user?.email || '',
    isAdmin,
    isSupervisor,
    isITStaff,
    isStaff,
    canManageSettings,
    login: (token, user) => dispatch(setCredentials({ token, user })),
    logout: () => dispatch(logout()),
    updateProfile: (data) => dispatch(updateUserProfile(data)),
  };
};

export const useUI = () => {
  const dispatch = useAppDispatch();
  const badgeCounts = useSelector(selectBadgeCounts);
  const selectedComponent = useSelector(selectSelectedComponent);
  const isSidebarCollapsed = useSelector(selectIsSidebarCollapsed);

  return {
    badgeCounts,
    selectedComponent,
    isSidebarCollapsed,
    setComponent: (name) => dispatch(setSelectedComponent(name)),
    toggleSidebar: () => dispatch(toggleSidebar()),
    setBadges: (counts) => dispatch(setBadgeCounts(counts)),
    updateBadge: (key, count) => dispatch(updateSingleBadgeCount({ key, count })),
  };
};
