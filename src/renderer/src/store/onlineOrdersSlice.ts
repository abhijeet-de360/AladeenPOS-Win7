import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '../services/api_service'
import { Order } from '../types'

export interface OnlineOrdersState {
  loadingStatus: boolean
  onlineOrders: Order[]
  isConnected: boolean
  newIncomingOrderPopup: Order | null
}

const initialState: OnlineOrdersState = {
  loadingStatus: false,
  onlineOrders: [],
  isConnected: false,
  newIncomingOrderPopup: null
}

export const onlineOrdersSlice = createSlice({
  name: 'onlineOrders',
  initialState,
  reducers: {
    setOnlineOrders(state, action: PayloadAction<Order[]>) {
      state.onlineOrders = action.payload || []
    },
    updateLocalOrderStatus(state, action: PayloadAction<{ id: string; status: Order['status']; prepTime?: number }>) {
      const { id, status, prepTime } = action.payload
      state.onlineOrders = state.onlineOrders.map((o) =>
        o.id === id || o.rawId === id
          ? { ...o, status, ...(prepTime !== undefined ? { prepTime } : {}) }
          : o
      )
    },
    setOnlineOrdersLoading(state, action: PayloadAction<boolean>) {
      state.loadingStatus = action.payload
    },
    setSocketConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload
    },
    setNewIncomingOrderPopup(state, action: PayloadAction<Order | null>) {
      state.newIncomingOrderPopup = action.payload
    }
  }
})

export const {
  setOnlineOrders,
  updateLocalOrderStatus,
  setOnlineOrdersLoading,
  setSocketConnected,
  setNewIncomingOrderPopup
} = onlineOrdersSlice.actions

export default onlineOrdersSlice.reducer

// --- Thunk Actions ---
export function fetchOnlineOrders() {
  return async function fetchOnlineOrdersThunk(dispatch: any) {
    try {
      dispatch(setOnlineOrdersLoading(true))
      const response = await apiService.getOnlineOrders()
      if (response.data) {
        dispatch(setOnlineOrders(response.data))
      }
      dispatch(setOnlineOrdersLoading(false))
    } catch (err: any) {
      console.error('Error fetching online orders:', err)
      dispatch(setOnlineOrdersLoading(false))
    }
  }
}

export function updateOrderStatusThunk(orderId: string, status: Order['status'], prepTime?: number) {
  return async function updateOrderStatusThunkHandler(dispatch: any) {
    try {
      dispatch(updateLocalOrderStatus({ id: orderId, status, prepTime }))
      await apiService.updateOnlineOrderStatus(orderId, status, prepTime)
    } catch (err: any) {
      console.error('Error updating online order status:', err)
      dispatch(fetchOnlineOrders())
    }
  }
}
