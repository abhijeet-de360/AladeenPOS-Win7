import { createSlice } from '@reduxjs/toolkit';
import { apiService } from '../services/api_service';

export interface PosCustomization {
  _id?: string;
  name: string;
  price: number;
  status: 'active' | 'deleted';
}

export interface PosMenuItem {
  _id: string;
  code: string;
  name: string;
  price: number;
  category: string;
  type: 'veg' | 'nonVeg';
  customization?: PosCustomization[];
  status: 'active' | 'inactive' | 'deleted';
  createdAt?: string;
}

const initialState = {
  loadingStatus: false,
  error: '',
  posMenuList: [] as PosMenuItem[],
  totalPosItems: 0
};

export const posMenuSlice = createSlice({
  name: 'posMenu',
  initialState,
  reducers: {
    setPosMenuData(state, { payload }) {
      const data = payload?.data || payload || [];
      state.posMenuList = data;
      state.totalPosItems = data.length;
    },
    updatePosMenuData(state, { payload }) {
      const objIndex = state.posMenuList.findIndex((obj) => obj._id === payload._id);
      if (objIndex >= 0) {
        state.posMenuList[objIndex] = payload;
      }
    },
    pushPosMenuData(state, { payload }) {
      state.posMenuList.unshift(payload);
      state.totalPosItems += 1;
    },
    removePosMenuData(state, { payload }) {
      state.posMenuList = state.posMenuList.filter((obj) => obj._id !== payload._id && obj._id !== payload);
      state.totalPosItems = Math.max(0, state.totalPosItems - 1);
    },
    setPosMenuLoading(state, action) {
      state.loadingStatus = action.payload;
    }
  }
});

export const {
  setPosMenuData,
  updatePosMenuData,
  pushPosMenuData,
  removePosMenuData,
  setPosMenuLoading
} = posMenuSlice.actions;

export default posMenuSlice.reducer;

// --- Thunk Function ---
export function getPosMenuList(search = '', category = '') {
  return async function getPosMenuListThunk(dispatch: any) {
    try {
      dispatch(setPosMenuLoading(true));
      const response = await apiService.getPosMenuList(search, category);
      if (response.data) {
        dispatch(setPosMenuData(response.data));
      }
      dispatch(setPosMenuLoading(false));
    } catch (err: any) {
      dispatch(setPosMenuLoading(false));
    }
  };
}
