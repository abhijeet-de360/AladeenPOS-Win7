
export interface Product {
  id: string
  code: string
  name: string
  price: number
  category: 'food' | 'drink' | 'dessert'
  stock: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderItemDetail {
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  rawId?: string
  customer: string
  items: string
  itemList?: OrderItemDetail[]
  date: string
  amount: number
  status: 'Completed' | 'Pending' | 'Preparing' | 'Ready' | 'OutForDelivery' | 'Rejected'
  type: 'POS' | 'Online'
  deliveryType?: 'delivery' | 'pickup' | string
  deliveryAddress?: string
  customerPhone?: string
  paymentType?: string
  prepTime?: number
  orderNotes?: string
  table?: string
  discount?: number
}