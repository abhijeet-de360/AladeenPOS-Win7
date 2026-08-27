import { createSlice } from '@reduxjs/toolkit'
import { apiService } from '../services/api_service'

export interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: any | null
  loading: boolean
  error: string | null
}

const initialAuth = () => {
  const token = localStorage.getItem('pos_token')
  return {
    isAuthenticated: !!token,
    token: token || null,
    user: token ? JSON.parse(localStorage.getItem('pos_user') || '{}') : null,
    loading: false,
    error: null
  }
}

const initialState: AuthState = initialAuth()

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading(state, action) {
      state.loading = action.payload
      if (action.payload) state.error = null
    },
    setAuthError(state, action) {
      state.error = action.payload
      state.loading = false
    },
    setLoginSuccess(state, action) {
      state.isAuthenticated = true
      state.token = action.payload.token || 'pos_demo_token'
      state.user = action.payload.user || action.payload
      state.loading = false
      state.error = null
      localStorage.setItem('pos_token', state.token!)
      localStorage.setItem('pos_user', JSON.stringify(state.user))
    },
    logout(state) {
      state.isAuthenticated = false
      state.token = null
      state.user = null
      state.loading = false
      state.error = null
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
    }
  }
})

export const { setAuthLoading, setAuthError, setLoginSuccess, logout } = authSlice.actions
export default authSlice.reducer

// --- Thunk for real Admin/POS Staff Login API ---
export function loginUser(email: string, password: string) {
  return async function loginUserThunk(dispatch: any) {
    try {
      dispatch(setAuthLoading(true))
      const res = await apiService.loginAdmin({ email, password })
      const data = res.data
      console.log(data)

      if (data.message === 'User not found' || data.message === 'Invalid credentials') {
        const errorMsg = data.message || 'Login failed. Please check credentials.'
        dispatch(setAuthError(errorMsg))
        throw new Error(errorMsg)
      }

      dispatch(setLoginSuccess(data))
      return data
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Server connection error.'
      dispatch(setAuthError(errorMsg))
      throw new Error(errorMsg)
    }
  }
}

