import axios from 'axios';

export const rootUrl = 'https://server.aladeenbangkok.com/api/v1/';
export const assetUrl = 'https://server.aladeenbangkok.com';
export const socketUrl = 'https://server.aladeenbangkok.com';

// export const rootUrl = 'http://localhost:7120/api/v1/';
// export const assetUrl = 'http://localhost:7120';
// export const socketUrl = 'http://localhost:7120';

const authURL = rootUrl + 'admin';
const posMenuURL = rootUrl + 'pos-menu';
const posCategoryURL = rootUrl + 'pos-category';
const onlineOrdersURL = rootUrl + 'cart/online-orders';
const posOrdersURL = rootUrl + 'pos-orders';
const orderHistoryURL = rootUrl + 'order-history';
const settingsURL = rootUrl + 'settings';

const authHeader = () => {
  const token = localStorage.getItem('pos_token');
  return {
    Authorization: token ? `Bearer ${token}` : ''
  };
};

async function loginAdmin(loginData: { email: string; password: string }) {
  return await axios.post(authURL + '/login', loginData);
}

async function getPosMenuList(search = '', category = '') {
  return await axios.get(posMenuURL + `?search=${search}&category=${category}`, {
    headers: authHeader()
  });
}

async function getPosCategories() {
  return await axios.get(posCategoryURL, {
    headers: authHeader()
  });
}

async function getOnlineOrders() {
  return await axios.get(onlineOrdersURL, {
    headers: authHeader()
  });
}

async function updateOnlineOrderStatus(orderId: string, status: string, prepTime?: number) {
  return await axios.patch(`${onlineOrdersURL}/${encodeURIComponent(orderId)}/status`, {
    status,
    prepTime
  }, {
    headers: authHeader()
  });
}

async function createPosOrder(orderData: any) {
  return await axios.post(posOrdersURL, orderData, {
    headers: authHeader()
  });
}

async function getPosOrders(keyword = '', todayOnly = true) {
  return await axios.get(`${posOrdersURL}?keyword=${encodeURIComponent(keyword)}&todayOnly=${todayOnly}`, {
    headers: authHeader()
  });
}

async function updatePosOrder(orderId: string, orderData: any) {
  return await axios.patch(`${posOrdersURL}/${encodeURIComponent(orderId)}`, orderData, {
    headers: authHeader()
  });
}

async function getOrderHistory(type = 'All', keyword = '', todayOnly = true) {
  return await axios.get(`${orderHistoryURL}?type=${encodeURIComponent(type)}&keyword=${encodeURIComponent(keyword)}&todayOnly=${todayOnly}`, {
    headers: authHeader()
  });
}

async function getSettings() {
  return await axios.get(settingsURL, {
    headers: authHeader()
  });
}

async function updateSettings(data: any) {
  return await axios.patch(settingsURL, data, {
    headers: authHeader()
  });
}

export const apiService = {
  loginAdmin,
  getPosMenuList,
  getPosCategories,
  getOnlineOrders,
  updateOnlineOrderStatus,
  createPosOrder,
  getPosOrders,
  updatePosOrder,
  getOrderHistory,
  getSettings,
  updateSettings
};
