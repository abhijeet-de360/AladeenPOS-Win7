import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '../services/api_service'
import { Order } from '../types'

export interface OrderHistoryState {
  loadingStatus: boolean
  historyOrders: Order[]
  totalRevenue: number
  posCount: number
  onlineCount: number
}

const initialState: OrderHistoryState = {
  loadingStatus: false,
  historyOrders: [],
  totalRevenue: 0,
  posCount: 0,
  onlineCount: 0
}

export const orderHistorySlice = createSlice({
  name: 'orderHistory',
  initialState,
  reducers: {
    setOrderHistoryData(
      state,
      action: PayloadAction<{
        orders: Order[]
        totalRevenue: number
        posCount: number
        onlineCount: number
      }>
    ) {
      state.historyOrders = action.payload.orders || []
      state.totalRevenue = action.payload.totalRevenue || 0
      state.posCount = action.payload.posCount || 0
      state.onlineCount = action.payload.onlineCount || 0
    },
    setOrderHistoryLoading(state, action: PayloadAction<boolean>) {
      state.loadingStatus = action.payload
    }
  }
})

export const { setOrderHistoryData, setOrderHistoryLoading } = orderHistorySlice.actions

export default orderHistorySlice.reducer

// --- Thunks ---
export function fetchOrderHistoryThunk(type = 'All', keyword = '', todayOnly = true) {
  return async function fetchOrderHistoryThunkHandler(dispatch: any) {
    try {
      dispatch(setOrderHistoryLoading(true))
      const response = await apiService.getOrderHistory(type, keyword, todayOnly)
      if (response.data) {
        dispatch(
          setOrderHistoryData({
            orders: response.data.data || [],
            totalRevenue: response.data.totalRevenue || 0,
            posCount: response.data.posCount || 0,
            onlineCount: response.data.onlineCount || 0
          })
        )
      }
      dispatch(setOrderHistoryLoading(false))
    } catch (err: any) {
      console.error('Error fetching order history logs:', err)
      dispatch(setOrderHistoryLoading(false))
    }
  }
}
