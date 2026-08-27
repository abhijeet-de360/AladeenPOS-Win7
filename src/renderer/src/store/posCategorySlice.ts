import { createSlice } from '@reduxjs/toolkit';
import { apiService } from '../services/api_service';

export interface PosCategory {
  _id: string;
  name: string;
  status: 'active' | 'inactive' | 'deleted';
  createdAt?: string;
}

const initialState = {
  loadingStatus: false,
  error: '',
  posCategoryList: [] as PosCategory[],
  totalPosCategories: 0
};

export const posCategorySlice = createSlice({
  name: 'posCategory',
  initialState,
  reducers: {
    setPosCategoryData(state, { payload }) {
      const data = payload?.data || payload || [];
      state.posCategoryList = data;
      state.totalPosCategories = data.length;
    },
    updatePosCategoryData(state, { payload }) {
      const objIndex = state.posCategoryList.findIndex((obj) => obj._id === payload._id);
      if (objIndex >= 0) {
        state.posCategoryList[objIndex] = payload;
      }
    },
    pushPosCategoryData(state, { payload }) {
      state.posCategoryList.unshift(payload);
      state.totalPosCategories += 1;
    },
    removePosCategoryData(state, { payload }) {
      state.posCategoryList = state.posCategoryList.filter((obj) => obj._id !== payload._id && obj._id !== payload);
      state.totalPosCategories = Math.max(0, state.totalPosCategories - 1);
    },
    setPosCategoryLoading(state, action) {
      state.loadingStatus = action.payload;
    }
  }
});

export const {
  setPosCategoryData,
  updatePosCategoryData,
  pushPosCategoryData,
  removePosCategoryData,
  setPosCategoryLoading
} = posCategorySlice.actions;

export default posCategorySlice.reducer;

// --- Thunk Function ---
export function getPosCategoryList() {
  return async function getPosCategoryListThunk(dispatch: any) {
    try {
      dispatch(setPosCategoryLoading(true));
      const response = await apiService.getPosCategories();
      if (response.data) {
        dispatch(setPosCategoryData(response.data));
      }
      dispatch(setPosCategoryLoading(false));
    } catch (err: any) {
      dispatch(setPosCategoryLoading(false));
    }
  };
}
