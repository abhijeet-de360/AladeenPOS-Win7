import React, { useState, useEffect } from 'react'
import { Printer, Search, ShoppingBag, Globe, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import HeaderLayout from '../components/HeaderLayout'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { Order } from '../types'
import { RootState, AppDispatch } from '../store/store'
import { fetchOrderHistoryThunk } from '../store/orderHistorySlice'

export default function OrderHistoryScreen(): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { historyOrders, totalRevenue, posCount, onlineCount } = useSelector((state: RootState) => state.orderHistory)

  const [filterType, setFilterType] = useState<'All' | 'POS' | 'Online'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [isSimulatingPrint, setIsSimulatingPrint] = useState(false)
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false)

  useEffect(() => {
    dispatch(fetchOrderHistoryThunk(filterType, searchQuery, true))
  }, [dispatch, filterType, searchQuery])

  const handleSimulatePrint = (): void => {
    setIsSimulatingPrint(true)
    setTimeout(() => {
      setIsSimulatingPrint(false)
      alert('Mock print ticket sent successfully to POS Thermal Receipt printer.')
    }, 1200)
  }

  return (
    <HeaderLayout>
      <div className="history-workspace-new">
        <div className="history-stats-grid">
          <div className="history-stat-card">
            <div className="stat-icon-wrapper revenue">
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Shift Transactions Value</span>
              <span className="stat-value">฿{totalRevenue.toFixed(2)}</span>
            </div>
          </div>
          <div className="history-stat-card">
            <div className="stat-icon-wrapper pos">
              <ShoppingBag size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Local POS Orders</span>
              <span className="stat-value">{posCount} Orders</span>
            </div>
          </div>
          <div className="history-stat-card">
            <div className="stat-icon-wrapper online">
              <Globe size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Online Web Orders</span>
              <span className="stat-value">{onlineCount} Orders</span>
            </div>
          </div>
        </div>

        <div className="history-table-panel">
          <div className="history-controls-bar">
            <div className="history-filter-tabs">
              <button
                className={`history-filter-btn ${filterType === 'All' ? 'active' : ''}`}
                onClick={(): void => setFilterType('All')}
              >
                All Orders ({historyOrders.length})
              </button>
              <button
                className={`history-filter-btn ${filterType === 'POS' ? 'active' : ''}`}
                onClick={(): void => setFilterType('POS')}
              >
                <ShoppingBag size={14} />
                <span>POS Local ({posCount})</span>
              </button>
              <button
                className={`history-filter-btn ${filterType === 'Online' ? 'active' : ''}`}
                onClick={(): void => setFilterType('Online')}
              >
                <Globe size={14} />
                <span>Online Web ({onlineCount})</span>
              </button>
            </div>

            <div className="history-search-wrapper">
              <Search className="history-search-icon" size={16} />
              <input
                type="text"
                className="history-search-input"
                placeholder="Search Order ID, Client, Items..."
                value={searchQuery}
                onChange={(e): void => setSearchQuery(e.target.value)}
                onClick={(): void => {
                  setShowVirtualKeyboard(true)
                  if (window.api && (window.api as any).openVirtualKeyboard) {
                    ;(window.api as any).openVirtualKeyboard()
                  }
                }}
                onFocus={(): void => {
                  setShowVirtualKeyboard(true)
                  if (window.api && (window.api as any).openVirtualKeyboard) {
                    ;(window.api as any).openVirtualKeyboard()
                  }
                }}
              />
              <VirtualKeyboard
                isOpen={showVirtualKeyboard}
                onClose={(): void => setShowVirtualKeyboard(false)}
                value={searchQuery}
                onChange={(val): void => setSearchQuery(val)}
                title="Order History Search Keyboard"
              />
            </div>
          </div>

          <div className="history-table-container">
            <table className="data-table-new">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Source Channel</th>
                  <th>Customer / Table</th>
                  <th>Items Summary</th>
                  <th>Timestamp</th>
                  <th>Amount Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Receipt Action</th>
                </tr>
              </thead>
              <tbody>
                {historyOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span className="history-order-id">{o.id}</span>
                    </td>
                    <td>
                      <span className={`channel-badge ${o.type.toLowerCase()}`}>
                        {o.type === 'POS' ? <ShoppingBag size={12} /> : <Globe size={12} />}
                        <span>{o.type}</span>
                      </span>
                    </td>
                    <td>
                      <div className="history-client-info">
                        <span className="client-name">{o.customer}</span>
                        {o.table && <span className="table-tag">{o.table}</span>}
                      </div>
                    </td>
                    <td className="history-items-cell" title={o.items}>
                      {o.items}
                    </td>
                    <td className="history-time-cell">{o.date}</td>
                    <td>
                      <span className="history-amount">฿{o.amount.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className={`history-status-pill ${o.status.toLowerCase()}`}>
                        {o.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        <span>{o.status}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="print-action-btn"
                        title="Re-print Thermal Receipt"
                        onClick={(): void => setReceiptOrder(o)}
                      >
                        <Printer size={15} />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {historyOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      No transaction history logs matched your shift filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {receiptOrder && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '360px', padding: '20px' }}>
              <div className="receipt-paper">
                <div className="receipt-header">
                <span className="receipt-store">Aladeen Restaurant</span>
                <div style={{ fontSize: '10px' }}>Bangkok, Thailand</div>
                <div style={{ fontSize: '10px' }}>Order Receipt</div>
              </div>
              <div className="receipt-body">
                <div>Date: {receiptOrder.date}</div>
                <div>Ticket: <strong>{receiptOrder.id}</strong></div>
                <div>Type: <strong>{(receiptOrder.deliveryType || receiptOrder.type || 'POS').toUpperCase()}</strong></div>
                {receiptOrder.type === 'POS' && <div>Table: {receiptOrder.table || 'Takeaway'}</div>}
                <div>Client: {receiptOrder.customer}</div>
                {receiptOrder.customerPhone && <div>Phone: {receiptOrder.customerPhone}</div>}

                {(receiptOrder.deliveryType || '').toLowerCase() === 'delivery' && receiptOrder.deliveryAddress ? (
                  <>
                    <div className="receipt-divider"></div>
                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>DELIVERY ADDRESS:</div>
                    <div style={{ fontSize: '10px', background: '#f3f4f6', padding: '4px 6px', borderRadius: '4px', margin: '3px 0 6px', lineHeight: 1.35 }}>
                      {receiptOrder.deliveryAddress}
                    </div>
                  </>
                ) : null}

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
                  {receiptOrder.orderNotes && (
                    <>
                      <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#b45309' }}>NOTE / INSTRUCTIONS:</div>
                      <div style={{ fontSize: '10px', background: '#fef3c7', padding: '4px 6px', borderRadius: '4px', margin: '3px 0 6px' }}>
                        {receiptOrder.orderNotes}
                      </div>
                      <div className="receipt-divider"></div>
                    </>
                  )}
                  <div className="receipt-total">
                    <span>Paid Total:</span>
                    <span>฿{receiptOrder.amount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="receipt-footer">
                  Thank you for visiting Aladeen Cafe!
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  onClick={(): void => setReceiptOrder(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="place-order-btn"
                  style={{ flex: 1, margin: 0, padding: '10px', fontSize: '13px' }}
                  disabled={isSimulatingPrint}
                  onClick={handleSimulatePrint}
                >
                  {isSimulatingPrint ? 'Printing...' : 'Print Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HeaderLayout>
  )
}
