import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import {
  setActiveTableId,
  addToTabCart,
  updateTabCartQty,
  removeFromTabCart,
  setTabDiscount,
  setTabPaymentMethod,
  clearTableTabThunk,
  saveTableTabThunk,
  checkoutTableTabThunk,
  fetchAndSyncPendingPosOrdersThunk,
  TableTab
} from '../store/tableTabsSlice'
import { ShoppingBag, Plus, Minus, Trash2, Utensils, Clock, Coins, QrCode, Percent } from 'lucide-react'
import HeaderLayout from '../components/HeaderLayout'
import { Product, Order } from '../types'
import { printThermalReceipt } from '../utils/printReceipt'

export default function PosTerminalScreen(): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { posMenuList = [] } = useSelector((state: RootState) => state.posMenu)
  const { posCategoryList = [] } = useSelector((state: RootState) => state.posCategory)
  const { activeTableId, tabs } = useSelector((state: RootState) => state.tableTabs)

  useEffect(() => {
    dispatch(fetchAndSyncPendingPosOrdersThunk())
  }, [dispatch])

  const activeTab: TableTab = tabs[activeTableId] || {
    tableId: activeTableId,
    cart: [],
    discountPercentage: 0,
    paymentMethod: 'Cash',
    status: 'empty'
  }

  const cart = activeTab.cart
  const discountPercentage = activeTab.discountPercentage
  const paymentMethod = activeTab.paymentMethod
  const taxPercentage = 7

  const [posSearchQuery, setPosSearchQuery] = useState('')
  const [posCategory, setPosCategory] = useState<string>('all')
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [isSimulatingPrint, setIsSimulatingPrint] = useState(false)

  // Map Redux store posMenuList to Product items
  const productsList: Product[] = useMemo(() => {
    if (posMenuList.length > 0) {
      return posMenuList.map((item: any) => ({
        id: item._id,
        code: item.code,
        name: item.name,
        price: item.price,
        category: item.categoryId?._id || item.categoryId || item.category || 'food',
        categoryName: item.categoryId?.name || '',
        stock: 99
      }))
    }
    return []
  }, [posMenuList])

  const posFilteredProducts = useMemo(() => {
    return productsList
      .filter((product: any) => {
        const q = posSearchQuery.toLowerCase()
        const matchesSearch =
          product.name.toLowerCase().includes(q) || (product.code && product.code.toLowerCase().includes(q))
        const matchesCategory =
          posCategory === 'all' ||
          product.category === posCategory ||
          product.categoryName === posCategory
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }))
  }, [productsList, posSearchQuery, posCategory])

  const triggerAutoSave = useCallback(
    (targetTableId: string) => {
      setTimeout(() => {
        void dispatch(saveTableTabThunk(targetTableId))
      }, 100)
    },
    [dispatch]
  )

  const handleSelectTable = (newTableId: string): void => {
    if (newTableId === activeTableId) return
    // Auto-save current table tab to DB before switching
    if (cart.length > 0) {
      void dispatch(saveTableTabThunk(activeTableId))
    }
    dispatch(setActiveTableId(newTableId))
  }

  const addToCart = (product: Product): void => {
    dispatch(addToTabCart({ tableId: activeTableId, product }))
    triggerAutoSave(activeTableId)
  }

  const updateCartQty = (productId: string, delta: number): void => {
    dispatch(updateTabCartQty({ tableId: activeTableId, productId, delta }))
    triggerAutoSave(activeTableId)
  }

  const removeFromCart = (productId: string): void => {
    dispatch(removeFromTabCart({ tableId: activeTableId, productId }))
    triggerAutoSave(activeTableId)
  }

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  }, [cart])

  const cartDiscountAmount = cartSubtotal * (discountPercentage / 100)
  const cartSubtotalAfterDiscount = cartSubtotal - cartDiscountAmount
  const cartTax = cartSubtotalAfterDiscount * (taxPercentage / 100)
  const cartTotal = cartSubtotalAfterDiscount + cartTax

  const handlePOSCheckout = async (): Promise<void> => {
    if (cart.length === 0) return
    try {
      const resultOrder = await dispatch(checkoutTableTabThunk(activeTableId))
      if (resultOrder) {
        setReceiptOrder(resultOrder)
      }
    } catch (err) {
      console.error('Checkout error:', err)
    }
  }

  const handleSimulatePrint = (): void => {
    if (!receiptOrder) return
    setIsSimulatingPrint(true)
    printThermalReceipt(receiptOrder)
    setTimeout(() => {
      setIsSimulatingPrint(false)
    }, 1000)
  }

  const renderTableCard = (tableName: string, label: string, isTakeaway = false): React.JSX.Element => {
    const tab = tabs[tableName] || { cart: [], status: 'empty' }
    const itemCount = tab.cart.reduce((sum, item) => sum + item.quantity, 0)
    const isOccupied = itemCount > 0 || Boolean(tab.orderId)
    const status: 'empty' | 'occupied' = isOccupied ? 'occupied' : 'empty'
    const isSelected = activeTableId === tableName

    const badgeText = isOccupied ? `${itemCount} Items` : 'Empty'

    return (
      <div
        key={tableName}
        className={`table-card ${status} ${isSelected ? 'selected' : ''}`}
        onClick={(): void => handleSelectTable(tableName)}
      >
        <div className={`table-card-badge ${status}`}>
          {isOccupied && <Clock size={10} />}
          <span>{badgeText}</span>
        </div>

        <div className="table-card-icon">
          {isTakeaway ? <ShoppingBag size={16} /> : <Utensils size={16} />}
        </div>

        <span className="table-card-number">{label}</span>
      </div>
    )
  }

  return (
    <HeaderLayout searchValue={posSearchQuery} onSearchChange={setPosSearchQuery}>
      <div className="pos-workspace">
        <div className="table-grid-sidebar">
          <div className="table-grid-body">
            {renderTableCard('Takeaway', 'Takeaway', true)}

            {Array.from({ length: 50 }, (_, i) => {
              const numStr = String(i + 1).padStart(2, '0')
              const tableName = `Table ${i + 1}`
              return renderTableCard(tableName, `Table (${numStr})`)
            })}
          </div>
        </div>

        <div className="pos-catalog">
          <div>
            <div className="pos-categories">
              <button
                className={`pos-category-pill ${posCategory === 'all' ? 'active' : ''}`}
                onClick={(): void => setPosCategory('all')}
              >
                All Items
              </button>
              {posCategoryList.map((cat: any) => (
                <button
                  key={cat._id}
                  className={`pos-category-pill ${posCategory === cat.name ? 'active' : ''}`}
                  onClick={(): void => setPosCategory(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pos-grid">
            {posFilteredProducts.map((p) => (
              <div key={p.id} className="pos-card" onClick={(): void => addToCart(p)}>
                <div className="pos-card-name" style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {p.name}
                </div>
                <div className="pos-card-price" style={{ marginBottom: '6px' }}>
                  ฿{p.price.toFixed(2)}
                </div>
                <span className="pos-card-code">{p.code}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pos-cart-panel">
          <div className="pos-cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#fdf4ff',
                  color: 'var(--primary)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid #f5d0fe'
                }}
              >
                {activeTableId} {activeTab.orderId ? `(${activeTab.orderId})` : ''}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                className="cart-clear-btn"
                title="Clear Cart"
                onClick={(): void => {
                  void dispatch(clearTableTabThunk(activeTableId))
                }}
              >
                <Trash2 size={14} />
                <span>Clear Tab</span>
              </button>
            )}
          </div>

          <div className="pos-cart-items">
            {cart.map((item) => (
              <div key={item.product.id} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <div className="pos-cart-item-name">
                    <span className="cart-item-code">{item.product.code}</span> {item.product.name}
                  </div>
                  <div className="pos-cart-item-price">฿{(item.product.price * item.quantity).toFixed(2)}</div>
                </div>

                <div className="pos-cart-item-controls">
                  <div className="pos-qty-group">
                    <button className="pos-qty-btn" onClick={(): void => updateCartQty(item.product.id, -1)}>
                      <Minus size={13} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button className="pos-qty-btn" onClick={(): void => updateCartQty(item.product.id, 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    className="pos-qty-btn"
                    style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
                    title="Remove Item"
                    onClick={(): void => removeFromCart(item.product.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShoppingBag size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <p style={{ fontSize: '12px' }}>Tab for {activeTableId} is empty</p>
              </div>
            )}
          </div>

          <div className="pos-cart-summary">
            <div className="pos-summary-row">
              <span>Sub Total</span>
              <span>฿{cartSubtotal.toFixed(2)}</span>
            </div>

            {/* Discount Row (1st: Text Box -> 2nd: % Discount -> 3rd: Amount) */}
            <div className="pos-summary-row" style={{ alignItems: 'center', marginTop: '4px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <button
                    type="button"
                    onClick={(): void => {
                      const current = discountPercentage || 0
                      const newVal = Math.max(0, current - 1)
                      dispatch(setTabDiscount({ tableId: activeTableId, discountPercentage: newVal }))
                      triggerAutoSave(activeTableId)
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: 'var(--bg-secondary, #f3f4f6)',
                      color: 'var(--text-primary, #111827)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Decrease discount"
                  >
                    <Minus size={12} />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    data-no-virtual-keyboard="true"
                    style={{
                      width: '40px',
                      padding: '3px 2px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '12px',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none'
                    }}
                    value={discountPercentage || ''}
                    onChange={(e): void => {
                      const rawVal = e.target.value
                      const parsed = parseInt(rawVal, 10)
                      const val = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed))
                      dispatch(setTabDiscount({ tableId: activeTableId, discountPercentage: val }))
                      triggerAutoSave(activeTableId)
                    }}
                  />

                  <button
                    type="button"
                    onClick={(): void => {
                      const current = discountPercentage || 0
                      const newVal = Math.min(100, current + 1)
                      dispatch(setTabDiscount({ tableId: activeTableId, discountPercentage: newVal }))
                      triggerAutoSave(activeTableId)
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: 'var(--bg-secondary, #f3f4f6)',
                      color: 'var(--text-primary, #111827)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Increase discount"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Percent size={13} color="var(--primary)" />
                  Discount
                </span>
              </div>

              <span>
                {discountPercentage > 0 ? (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                    -฿{cartDiscountAmount.toFixed(2)}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-฿0.00</span>
                )}
              </span>
            </div>

            <div className="pos-summary-row" style={{ alignItems: 'center' }}>
              <span>Tax {taxPercentage}% (VAT Included)</span>
              <span>฿{cartTax.toFixed(2)}</span>
            </div>

            <div className="payment-divider"></div>

            <div className="pos-summary-row total">
              <span className="total-label">Total</span>
              <span className="total-amount">฿{cartTotal.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-method-section">
              <label className="payment-method-title">Payment Method</label>
              <div className="payment-method-grid-2">
                <div
                  className={`payment-card ${paymentMethod === 'Cash' ? 'active' : ''}`}
                  onClick={(): void => {
                    dispatch(setTabPaymentMethod({ tableId: activeTableId, paymentMethod: 'Cash' }))
                    triggerAutoSave(activeTableId)
                  }}
                >
                  <div className="payment-card-icon">
                    <Coins size={22} />
                  </div>
                  <span>Cash</span>
                </div>

                <div
                  className={`payment-card ${paymentMethod === 'Online' ? 'active' : ''}`}
                  onClick={(): void => {
                    dispatch(setTabPaymentMethod({ tableId: activeTableId, paymentMethod: 'Online' }))
                    triggerAutoSave(activeTableId)
                  }}
                >
                  <div className="payment-card-icon">
                    <QrCode size={22} />
                  </div>
                  <span>Online</span>
                </div>
              </div>
            </div>

            <button
              className="place-order-btn"
              style={{ width: '100%', marginTop: '4px' }}
              disabled={cart.length === 0}
              onClick={handlePOSCheckout}
            >
              <span>Checkout</span>
            </button>
          </div>
        </div>
      </div>

      {receiptOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '360px', padding: '20px' }}>
            <div className="receipt-paper">
              <div className="receipt-header">
                <span className="receipt-store">Aladeen Restaurant</span>
                <div style={{ fontSize: '10px' }}>Bangkok, Thailand</div>
                <div style={{ fontSize: '10px' }}>POS Order Receipt</div>
              </div>
              <div className="receipt-body">
                <div>Date: {receiptOrder.date}</div>
                <div>Ticket: <strong>{receiptOrder.id}</strong></div>
                <div>Type: {receiptOrder.type} Sale</div>
                {receiptOrder.type === 'POS' && <div>Table: {receiptOrder.table || 'Takeaway'}</div>}
                <div>Client: {receiptOrder.customer}</div>

                <div className="receipt-divider"></div>

                <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ORDER ITEMS</div>
                <div style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                  {receiptOrder.items.split(', ').map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider"></div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Paid:</span>
                  <span>฿{receiptOrder.amount.toFixed(2)}</span>
                </div>

                <div className="receipt-divider" style={{ marginBottom: 0 }}></div>
                <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px' }}>
                  Thank you for your purchase!
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={isSimulatingPrint} onClick={handleSimulatePrint}>
                {isSimulatingPrint ? 'Printing...' : 'Print Ticket'}
              </button>
              <button className="logout-btn" style={{ flex: 1 }} onClick={(): void => setReceiptOrder(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </HeaderLayout>
  )
}
