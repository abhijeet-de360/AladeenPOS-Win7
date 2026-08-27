import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '../services/api_service'
import { CartItem, Product } from '../types'

export interface TableTab {
  tableId: string
  cart: CartItem[]
  discountPercentage: number
  paymentMethod: 'Cash' | 'Online'
  orderId?: string
  mongoId?: string
  status: 'empty' | 'occupied'
}

export interface TableTabsState {
  activeTableId: string
  tabs: Record<string, TableTab>
}

const createDefaultTab = (tableId: string): TableTab => ({
  tableId,
  cart: [],
  discountPercentage: 0,
  paymentMethod: 'Cash',
  status: 'empty'
})

const initialTabs: Record<string, TableTab> = {
  Takeaway: createDefaultTab('Takeaway')
}
for (let i = 1; i <= 50; i++) {
  const tName = `Table ${i}`
  initialTabs[tName] = createDefaultTab(tName)
}

const initialState: TableTabsState = {
  activeTableId: 'Takeaway',
  tabs: initialTabs
}

export const tableTabsSlice = createSlice({
  name: 'tableTabs',
  initialState,
  reducers: {
    setActiveTableId(state, action: PayloadAction<string>) {
      state.activeTableId = action.payload
      if (!state.tabs[action.payload]) {
        state.tabs[action.payload] = createDefaultTab(action.payload)
      }
    },
    addToTabCart(state, action: PayloadAction<{ tableId: string; product: Product }>) {
      const { tableId, product } = action.payload
      if (!state.tabs[tableId]) {
        state.tabs[tableId] = createDefaultTab(tableId)
      }

      const tab = state.tabs[tableId]
      const existing = tab.cart.find((item) => item.product.id === product.id)
      if (existing) {
        existing.quantity += 1
      } else {
        tab.cart.push({ product, quantity: 1 })
      }
      tab.status = 'occupied'
    },
    updateTabCartQty(state, action: PayloadAction<{ tableId: string; productId: string; delta: number }>) {
      const { tableId, productId, delta } = action.payload
      const tab = state.tabs[tableId]
      if (!tab) return

      const existing = tab.cart.find((item) => item.product.id === productId)
      if (existing) {
        existing.quantity += delta
        if (existing.quantity <= 0) {
          tab.cart = tab.cart.filter((item) => item.product.id !== productId)
        }
      }

      if (tab.cart.length === 0 && !tab.orderId) {
        tab.status = 'empty'
      } else {
        tab.status = 'occupied'
      }
    },
    removeFromTabCart(state, action: PayloadAction<{ tableId: string; productId: string }>) {
      const { tableId, productId } = action.payload
      const tab = state.tabs[tableId]
      if (!tab) return

      tab.cart = tab.cart.filter((item) => item.product.id !== productId)
      if (tab.cart.length === 0 && !tab.orderId) {
        tab.status = 'empty'
      }
    },
    setTabDiscount(state, action: PayloadAction<{ tableId: string; discountPercentage: number }>) {
      const { tableId, discountPercentage } = action.payload
      if (state.tabs[tableId]) {
        state.tabs[tableId].discountPercentage = discountPercentage
      }
    },
    setTabPaymentMethod(state, action: PayloadAction<{ tableId: string; paymentMethod: 'Cash' | 'Online' }>) {
      const { tableId, paymentMethod } = action.payload
      if (state.tabs[tableId]) {
        state.tabs[tableId].paymentMethod = paymentMethod
      }
    },
    setTabOrderId(state, action: PayloadAction<{ tableId: string; orderId: string; mongoId?: string }>) {
      const { tableId, orderId, mongoId } = action.payload
      if (state.tabs[tableId]) {
        state.tabs[tableId].orderId = orderId
        if (mongoId) state.tabs[tableId].mongoId = mongoId
        state.tabs[tableId].status = 'occupied'
      }
    },
    clearTab(state, action: PayloadAction<string>) {
      const tableId = action.payload
      state.tabs[tableId] = createDefaultTab(tableId)
    },
    syncPendingOrders(state, action: PayloadAction<any[]>) {
      const orders = action.payload || []
      orders.forEach((order) => {
        if (order.table && state.tabs[order.table]) {
          const tab = state.tabs[order.table]
          tab.mongoId = order._id
          tab.orderId = order.orderId || order._id
          tab.discountPercentage = order.discountPercentage || 0
          tab.paymentMethod = order.paymentMethod || 'Cash'
          tab.status = 'occupied'
          tab.cart = (order.items || []).map((item: any) => ({
            product: {
              id: item.productId || item._id || String(Math.random()),
              name: item.name,
              price: item.price,
              category: 'general'
            },
            quantity: item.quantity
          }))
        }
      })
    }
  }
})

export const {
  setActiveTableId,
  addToTabCart,
  updateTabCartQty,
  removeFromTabCart,
  setTabDiscount,
  setTabPaymentMethod,
  setTabOrderId,
  clearTab,
  syncPendingOrders
} = tableTabsSlice.actions

export default tableTabsSlice.reducer

// --- Thunk Actions ---
export function saveTableTabThunk(tableId: string) {
  return async function saveTableTabThunkHandler(dispatch: any, getState: any) {
    const { tableTabs } = getState()
    const tab: TableTab = tableTabs.tabs[tableId]
    if (!tab) return

    const targetKey = tab.mongoId || tab.orderId

    if (tab.cart.length === 0) {
      if (targetKey) {
        try {
          await apiService.updatePosOrder(targetKey, {
            items: [],
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: 0,
            status: 'Cancelled'
          })
        } catch (err) {
          console.error('Failed to cancel empty tab in DB:', err)
        }
      }
      return
    }

    const subtotal = tab.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discountAmount = subtotal * (tab.discountPercentage / 100)
    const subtotalAfterDiscount = subtotal - discountAmount
    const taxPercentage = 7
    const taxAmount = subtotalAfterDiscount * (taxPercentage / 100)
    const totalAmount = subtotalAfterDiscount + taxAmount

    const payload = {
      customer: 'Walk-in Client',
      items: tab.cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      table: tableId,
      subtotal,
      discountPercentage: tab.discountPercentage,
      discountAmount,
      taxPercentage,
      taxAmount,
      totalAmount,
      paymentMethod: tab.paymentMethod,
      status: 'Pending'
    }

    try {
      if (targetKey) {
        await apiService.updatePosOrder(targetKey, payload)
      } else {
        const res = await apiService.createPosOrder(payload)
        if (res.data && res.data.data) {
          const createdMongoId = res.data.data._id
          const createdOrderId = res.data.data.orderId
          dispatch(
            setTabOrderId({
              tableId,
              orderId: createdOrderId || createdMongoId,
              mongoId: createdMongoId
            })
          )
        }
      }
    } catch (err) {
      console.error('Failed to auto-save table tab:', err)
    }
  }
}

export function clearTableTabThunk(tableId: string) {
  return async function clearTableTabThunkHandler(dispatch: any, getState: any) {
    const { tableTabs } = getState()
    const tab: TableTab = tableTabs.tabs[tableId]
    const targetKey = tab?.mongoId || tab?.orderId

    if (targetKey) {
      try {
        await apiService.updatePosOrder(targetKey, {
          items: [],
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: 0,
          status: 'Cancelled'
        })
      } catch (err) {
        console.error('Failed to cancel pending POS order in DB on clear tab:', err)
      }
    }

    dispatch(clearTab(tableId))
  }
}

export function checkoutTableTabThunk(tableId: string) {
  return async function checkoutTableTabThunkHandler(dispatch: any, getState: any) {
    const { tableTabs } = getState()
    const tab: TableTab = tableTabs.tabs[tableId]
    if (!tab || tab.cart.length === 0) return

    const subtotal = tab.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discountAmount = subtotal * (tab.discountPercentage / 100)
    const subtotalAfterDiscount = subtotal - discountAmount
    const taxPercentage = 7
    const taxAmount = subtotalAfterDiscount * (taxPercentage / 100)
    const totalAmount = subtotalAfterDiscount + taxAmount

    let finalOrderId = tab.orderId

    const payload = {
      orderId: finalOrderId,
      customer: 'Walk-in Client',
      items: tab.cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      table: tableId,
      subtotal,
      discountPercentage: tab.discountPercentage,
      discountAmount,
      taxPercentage,
      taxAmount,
      totalAmount,
      paymentMethod: tab.paymentMethod,
      status: 'Completed'
    }

    const targetKey = tab.mongoId || tab.orderId

    try {
      if (targetKey) {
        await apiService.updatePosOrder(targetKey, payload)
      } else {
        const res = await apiService.createPosOrder(payload)
        if (res.data && res.data.data && res.data.data.orderId) {
          finalOrderId = res.data.data.orderId
        }
      }
    } catch (err) {
      console.error('Failed to complete POS order checkout:', err)
    }

    dispatch(clearTab(tableId))
    return {
      id: finalOrderId || '#POS-0001',
      customer: 'Walk-in Client',
      items: tab.cart.map((item) => `${item.quantity}x ${item.product.name}`).join(', '),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      amount: totalAmount,
      status: 'Completed' as const,
      type: 'POS' as const,
      table: tableId,
      discount: tab.discountPercentage
    }
  }
}

export function fetchAndSyncPendingPosOrdersThunk() {
  return async function fetchAndSyncHandler(dispatch: any) {
    try {
      const res = await apiService.getPosOrders('', true)
      if (res.data && res.data.data) {
        const pendingOrders = res.data.data.filter((o: any) => o.status === 'Pending')
        dispatch(syncPendingOrders(pendingOrders))
      }
    } catch (err) {
      console.error('Failed to sync pending POS orders:', err)
    }
  }
}
