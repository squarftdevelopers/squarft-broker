import { createSlice } from '@reduxjs/toolkit';

// Shape mirrors the API response from buildInventoryResponse on the backend.
// inventory[projectId][type] = { grouping, towers/ranges, summary }
const initialState = {
  // keyed by projectId
  byProject: {},
  // loading / error per projectId
  loading: {},
  error: {},
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventoryLoading: (state, action) => {
      const { projectId } = action.payload;
      state.loading[projectId] = true;
      state.error[projectId] = null;
    },
    setInventoryData: (state, action) => {
      const { projectId, data } = action.payload;
      state.byProject[projectId] = data;
      state.loading[projectId] = false;
      state.error[projectId] = null;
    },
    setInventoryError: (state, action) => {
      const { projectId, error } = action.payload;
      state.loading[projectId] = false;
      state.error[projectId] = error;
    },
    clearInventory: (state, action) => {
      const { projectId } = action.payload;
      delete state.byProject[projectId];
      delete state.loading[projectId];
      delete state.error[projectId];
    },
    resetInventory: () => initialState,
  },
});

export const {
  setInventoryLoading,
  setInventoryData,
  setInventoryError,
  clearInventory,
  resetInventory,
} = inventorySlice.actions;

export default inventorySlice.reducer;
