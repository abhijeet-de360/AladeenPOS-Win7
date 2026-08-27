import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface POSNotification {
  id: string
  title: string
  message: string
  type: 'new_order' | 'order_update' | 'system'
  timestamp: string
  read: boolean
  orderId?: string
}

export interface NotificationsState {
  notifications: POSNotification[]
  unreadCount: number
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0
}

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<POSNotification, 'id' | 'timestamp' | 'read'>>) {
      const newNotif: POSNotification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      }
      state.notifications.unshift(newNotif)
      state.unreadCount += 1
    },
    markAllAsRead(state) {
      state.notifications.forEach((n) => {
        n.read = true
      })
      state.unreadCount = 0
    },
    clearNotifications(state) {
      state.notifications = []
      state.unreadCount = 0
    }
  }
})

export const { addNotification, markAllAsRead, clearNotifications } = notificationsSlice.actions

export default notificationsSlice.reducer
