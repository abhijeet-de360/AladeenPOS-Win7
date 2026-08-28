import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from './store/store'
import { getPosMenuList } from './store/posMenuSlice'
import { getPosCategoryList } from './store/posCategorySlice'
import {
  fetchOnlineOrders,
  setOnlineOrders,
  setSocketConnected,
  setNewIncomingOrderPopup
} from './store/onlineOrdersSlice'
import { addNotification } from './store/notificationsSlice'
import { io, Socket } from 'socket.io-client'
import { socketUrl } from './services/api_service'
import { playNewOrderAlert } from './utils/audioAlert'
import LoginScreen from './pages/LoginScreen'
import PosTerminalScreen from './pages/PosTerminalScreen'
import OnlineOrdersScreen from './pages/OnlineOrdersScreen'
import OrderHistoryScreen from './pages/OrderHistoryScreen'
import PrivateRoute from './components/PrivateRoute'
import GlobalOrderPopup from './components/GlobalOrderPopup'

import { useTouchScroll } from './utils/useTouchScroll'

function App(): React.JSX.Element {
  useTouchScroll()
  const dispatch = useDispatch<AppDispatch>()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getPosMenuList('', ''))
      dispatch(getPosCategoryList())
      dispatch(fetchOnlineOrders())
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    let socket: Socket | null = null

    socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('[Socket Global] Connected to server:', socket?.id)
      dispatch(setSocketConnected(true))
      dispatch(fetchOnlineOrders())
    })

    socket.on('disconnect', () => {
      console.log('[Socket Global] Disconnected from server')
      dispatch(setSocketConnected(false))
    })

    socket.on('new_order', (data) => {
      console.log('[Socket Global] Real-time new_order received:', data)
      playNewOrderAlert()

      const targetOrder = data.order || (data.orders && data.orders[0])
      const orderRef = targetOrder ? targetOrder.id : 'Web Order'
      const clientName = targetOrder ? targetOrder.customer : 'Online Client'

      dispatch(
        addNotification({
          title: '🎉 New Online Order!',
          message: `Order ${orderRef} placed by ${clientName}`,
          type: 'new_order',
          orderId: orderRef
        })
      )

      if (data.orders && Array.isArray(data.orders)) {
        dispatch(setOnlineOrders(data.orders))
        if (data.order) {
          dispatch(setNewIncomingOrderPopup(data.order))
        } else if (data.orders.length > 0) {
          dispatch(setNewIncomingOrderPopup(data.orders[0]))
        }
      } else {
        dispatch(fetchOnlineOrders())
      }
    })

    socket.on('order_updated', (data) => {
      console.log('[Socket Global] Real-time order_updated received:', data)

      const orderRef = data.orderId || 'Order'
      const newStatus = data.status || 'Updated'

      dispatch(
        addNotification({
          title: 'Order Status Changed',
          message: `Order ${orderRef} status updated to ${newStatus}`,
          type: 'order_update',
          orderId: orderRef
        })
      )

      if (data.orders && Array.isArray(data.orders)) {
        dispatch(setOnlineOrders(data.orders))
      } else {
        dispatch(fetchOnlineOrders())
      }
    })

    return () => {
      if (socket) socket.disconnect()
    }
  }, [dispatch])

  return (
    <Router>
      <GlobalOrderPopup />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<PrivateRoute element={<PosTerminalScreen />} />} />
        <Route path="/online-orders" element={<PrivateRoute element={<OnlineOrdersScreen />} />} />
        <Route path="/order-history" element={<PrivateRoute element={<OrderHistoryScreen />} />} />
      </Routes>
    </Router>
  )
}

export default App
