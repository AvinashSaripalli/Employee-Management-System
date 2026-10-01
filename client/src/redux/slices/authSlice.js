import { createSlice } from '@reduxjs/toolkit';

// Hydrate initial user state from any existing session in storage
const getInitialUser = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
      id: localStorage.getItem('userId'),
      employeeId: localStorage.getItem('userEmployeeId') || localStorage.getItem('employeeId') || '',
      firstName: localStorage.getItem('userFirstName') || '',
      lastName: localStorage.getItem('userLastName') || '',
      name: `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || localStorage.getItem('userName') || 'User',
      email: localStorage.getItem('userEmail') || '',
      role: localStorage.getItem('userRole') || localStorage.getItem('role') || 'Employee',
      departmentRole: localStorage.getItem('departmentRole') || 'Member',
      department: localStorage.getItem('userDepartment') || localStorage.getItem('department') || '',
      designation: localStorage.getItem('userDesignation') || '',
      companyName: localStorage.getItem('companyName') || 'KN Advisors',
      jobLocation: localStorage.getItem('userJobLocation') || '',
      phoneNumber: localStorage.getItem('userPhoneNumber') || '',
      photo: localStorage.getItem('userPhoto') || null,
      technicalSkills: localStorage.getItem('userTechnicalSkills') || '',
      dateOfBirth: localStorage.getItem('userDateofBirth') || '',
      bloodGroup: localStorage.getItem('userBloodGroup') || '',
      gender: localStorage.getItem('userGender') || '',
    };
  } catch {
    return null;
  }
};

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const initialUser = getInitialUser();

const initialState = {
  token: initialToken,
  user: initialUser,
  isAuthenticated: Boolean(initialToken),
  status: 'idle',
  error: null,
};

// Helper to keep localStorage in sync for legacy synchronous callers & axios interceptor
const syncToLocalStorage = (token, user) => {
  try {
    if (token) localStorage.setItem('token', token);
    if (!user) return;
    if (user.role) localStorage.setItem('userRole', user.role);
    if (user.departmentRole) localStorage.setItem('departmentRole', user.departmentRole);
    if (user.companyName) localStorage.setItem('companyName', user.companyName);
    if (user.employeeId) localStorage.setItem('userEmployeeId', user.employeeId);
    if (user.id) localStorage.setItem('userId', String(user.id));
    if (user.email) localStorage.setItem('userEmail', user.email);
    if (user.firstName) localStorage.setItem('userFirstName', user.firstName);
    if (user.lastName) localStorage.setItem('userLastName', user.lastName);
    if (user.department) localStorage.setItem('userDepartment', user.department);
    if (user.designation) localStorage.setItem('userDesignation', user.designation);
    if (user.jobLocation) localStorage.setItem('userJobLocation', user.jobLocation);
    if (user.phoneNumber) localStorage.setItem('userPhoneNumber', user.phoneNumber);
    if (user.technicalSkills) localStorage.setItem('userTechnicalSkills', String(user.technicalSkills));
    if (user.dateOfBirth) localStorage.setItem('userDateofBirth', user.dateOfBirth);
    if (user.bloodGroup) localStorage.setItem('userBloodGroup', user.bloodGroup);
    if (user.gender) localStorage.setItem('userGender', user.gender);

    if (user.photo && user.photo !== 'null' && user.photo !== 'undefined') {
      localStorage.setItem('userPhoto', user.photo);
    } else {
      localStorage.removeItem('userPhoto');
    }
  } catch (e) {
    console.warn('Storage sync error:', e);
  }
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = {
        ...user,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      };
      state.isAuthenticated = true;
      state.error = null;
      syncToLocalStorage(token, state.user);
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
          name: action.payload.name || `${action.payload.firstName || state.user.firstName || ''} ${action.payload.lastName || state.user.lastName || ''}`.trim() || state.user.name,
        };
        syncToLocalStorage(state.token, state.user);
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('Storage clear error:', e);
      }
    },
  },
});

export const { setCredentials, updateUserProfile, logout } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role || 'Employee';
export const selectDepartmentRole = (state) => state.auth.user?.departmentRole || 'Member';
export const selectCompanyName = (state) => state.auth.user?.companyName || 'KN Advisors';
export const selectEmployeeId = (state) => state.auth.user?.employeeId || '';

export default authSlice.reducer;
