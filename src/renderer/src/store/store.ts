import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import posMenuReducer from './posMenuSlice';
import posCategoryReducer from './posCategorySlice';
import onlineOrdersReducer from './onlineOrdersSlice';
import posOrdersReducer from './posOrderSlice';
import tableTabsReducer from './tableTabsSlice';
import orderHistoryReducer from './orderHistorySlice';
import notificationsReducer from './notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posMenu: posMenuReducer,
    posCategory: posCategoryReducer,
    onlineOrders: onlineOrdersReducer,
    posOrders: posOrdersReducer,
    tableTabs: tableTabsReducer,
    orderHistory: orderHistoryReducer,
    notifications: notificationsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
