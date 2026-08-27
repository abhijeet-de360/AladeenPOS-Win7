import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '../services/api_service'

export interface PosOrderItem {
  productId?: string
  name: string
  price: number
  quantity: number
}

export interface PosOrderRecord {
  _id?: string
  orderId: string
  customer: string
  items: PosOrderItem[]
  table: string
  subtotal: number
  discountPercentage: number
  discountAmount: number
  taxPercentage: number
  taxAmount: number
  totalAmount: number
  paymentMethod: 'Cash' | 'Online'
  status: 'Completed' | 'Pending' | 'Cancelled'
  orderedAt?: string
}

export interface PosOrderState {
  loadingStatus: boolean
  posOrdersList: PosOrderRecord[]
  totalPosOrders: number
}

const initialState: PosOrderState = {
  loadingStatus: false,
  posOrdersList: [],
  totalPosOrders: 0
}

export const posOrderSlice = createSlice({
  name: 'posOrders',
  initialState,
  reducers: {
    setPosOrdersData(state, action: PayloadAction<{ orders: PosOrderRecord[]; total: number }>) {
      state.posOrdersList = action.payload.orders || []
      state.totalPosOrders = action.payload.total || 0
    },
    pushPosOrderData(state, action: PayloadAction<PosOrderRecord>) {
      state.posOrdersList.unshift(action.payload)
      state.totalPosOrders += 1
    },
    setPosOrdersLoading(state, action: PayloadAction<boolean>) {
      state.loadingStatus = action.payload
    }
  }
})

export const { setPosOrdersData, pushPosOrderData, setPosOrdersLoading } = posOrderSlice.actions

export default posOrderSlice.reducer

// --- Thunks ---
export function createPosOrderThunk(orderData: any) {
  return async function createPosOrderThunkHandler(dispatch: any) {
    try {
      dispatch(setPosOrdersLoading(true))
      const response = await apiService.createPosOrder(orderData)
      if (response.data && response.data.data) {
        dispatch(pushPosOrderData(response.data.data))
      }
      dispatch(setPosOrdersLoading(false))
      return response.data
    } catch (err: any) {
      console.error('Error creating POS order thunk:', err)
      dispatch(setPosOrdersLoading(false))
      throw err
    }
  }
}

export function fetchPosOrdersThunk(keyword = '', todayOnly = true) {
  return async function fetchPosOrdersThunkHandler(dispatch: any) {
    try {
      dispatch(setPosOrdersLoading(true))
      const response = await apiService.getPosOrders(keyword, todayOnly)
      if (response.data) {
        dispatch(
          setPosOrdersData({
            orders: response.data.data || [],
            total: response.data.total || 0
          })
        )
      }
      dispatch(setPosOrdersLoading(false))
    } catch (err: any) {
      console.error('Error fetching POS orders thunk:', err)
      dispatch(setPosOrdersLoading(false))
    }
  }
}
