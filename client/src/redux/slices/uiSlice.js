import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedComponent: 'Dashboard',
  isSidebarCollapsed: false,
  badgeCounts: {
    leaves: 0,
    attendance: 0,
    offboarding: 0,
    tasks: 0,
    helpdesk: 0,
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedComponent: (state, action) => {
      state.selectedComponent = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.isSidebarCollapsed = Boolean(action.payload);
    },
    setBadgeCounts: (state, action) => {
      state.badgeCounts = {
        ...state.badgeCounts,
        ...action.payload,
      };
    },
    updateSingleBadgeCount: (state, action) => {
      const { key, count } = action.payload;
      if (key in state.badgeCounts) {
        state.badgeCounts[key] = count;
      }
    },
  },
});

export const {
  setSelectedComponent,
  toggleSidebar,
  setSidebarCollapsed,
  setBadgeCounts,
  updateSingleBadgeCount,
} = uiSlice.actions;

export const selectSelectedComponent = (state) => state.ui.selectedComponent;
export const selectIsSidebarCollapsed = (state) => state.ui.isSidebarCollapsed;
export const selectBadgeCounts = (state) => state.ui.badgeCounts;

export default uiSlice.reducer;
