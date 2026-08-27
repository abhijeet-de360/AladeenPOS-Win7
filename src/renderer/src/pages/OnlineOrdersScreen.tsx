import React, { useState } from 'react'
import { Check, X, Clock, Printer, Wifi, WifiOff, BellRing } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import HeaderLayout from '../components/HeaderLayout'
import { Order } from '../types'
import { RootState, AppDispatch } from '../store/store'
import { updateOrderStatusThunk, setNewIncomingOrderPopup } from '../store/onlineOrdersSlice'
import { playNewOrderAlert } from '../utils/audioAlert'
import { printThermalReceipt } from '../utils/printReceipt'

export default function OnlineOrdersScreen(): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { onlineOrders, isConnected } = useSelector((state: RootState) => state.onlineOrders)

  const [prepTimeOrder, setPrepTimeOrder] = useState<Order | null>(null)
  const [prepTimeInput, setPrepTimeInput] = useState('20')
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [isSimulatingPrint, setIsSimulatingPrint] = useState(false)

  const activeOnlineOrders = onlineOrders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready'
  )

  const pendingOnlineCount = activeOnlineOrders.filter((o) => o.status === 'Pending').length

  const handleAcceptOnlineOrder = (order: Order): void => {
    setPrepTimeOrder(order)
    setPrepTimeInput('20')
  }

  const handleConfirmAccept = (): void => {
    if (!prepTimeOrder) return
    const mins = parseInt(prepTimeInput, 10) || 20
    const targetId = prepTimeOrder.rawId || prepTimeOrder.id

    dispatch(updateOrderStatusThunk(targetId, 'Preparing', mins))

    // Automatically print thermal receipt / KOT
    printThermalReceipt(prepTimeOrder, mins)

    setPrepTimeOrder(null)
  }

  const handleRejectOnlineOrder = (order: Order): void => {
    const targetId = order.rawId || order.id
    dispatch(updateOrderStatusThunk(targetId, 'Rejected'))
  }

  const handleUpdateOnlineStatus = (order: Order): void => {
    const isDelivery = (order.deliveryType || '').toLowerCase() === 'delivery'
    let nextStatus: Order['status'] = 'Completed'

    if (order.status === 'Preparing') {
      nextStatus = 'Ready'
    } else if (order.status === 'Ready') {
      nextStatus = isDelivery ? 'OutForDelivery' : 'Completed'
    } else if (order.status === 'OutForDelivery') {
      nextStatus = 'Completed'
    }

    const targetId = order.rawId || order.id
    dispatch(updateOrderStatusThunk(targetId, nextStatus))
  }

  const handleSimulatePrint = (): void => {
    if (!receiptOrder) return
    setIsSimulatingPrint(true)
    printThermalReceipt(receiptOrder)
    setTimeout(() => {
      setIsSimulatingPrint(false)
    }, 1000)
  }

  const handleTriggerTestPopup = (): void => {
    playNewOrderAlert()
    const testOrder: Order = {
      id: '#ONL-LIVE',
      customer: 'Incoming Client',
      items: '2x Caramel Latte, 1x Chocolate Brownie',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      amount: 480,
      status: 'Pending',
      type: 'Online'
    }
    dispatch(setNewIncomingOrderPopup(testOrder))
  }

  return (
    <HeaderLayout pendingOnlineCount={pendingOnlineCount}>
      <div className="online-workspace">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Online Orders Live Board</h2>
            <button
              onClick={handleTriggerTestPopup}
              style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                color: '#b45309',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <BellRing size={13} />
              <span>Test Sound & Popup</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', borderRadius: '12px', background: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isConnected ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isConnected ? 'Real-Time Sync Active' : 'Offline Mode'}</span>
          </div>
        </div>

        <div className="online-grid">
          {activeOnlineOrders.map((o) => (
            <div key={o.id} className={`online-card ${o.status.toLowerCase()}`}>
              <div className="online-card-header">
                <div>
                  <span className="online-card-id">{o.id}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{o.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: (o.deliveryType || '').toLowerCase() === 'delivery' ? '#eff6ff' : '#fef3c7',
                      color: (o.deliveryType || '').toLowerCase() === 'delivery' ? '#2563eb' : '#d97706',
                      textTransform: 'uppercase',
                    }}
                  >
                    {o.deliveryType || 'Pickup'}
                  </span>
                  <span className={`online-card-status ${o.status.toLowerCase()}`}>
                    {o.status === 'OutForDelivery' ? 'Out for Delivery' : o.status}
                  </span>
                </div>
              </div>

              <div className="online-card-body">
                <div>Client: <strong>{o.customer}</strong></div>
                <div className="online-card-items">
                  {o.items.split(', ').map((itemStr, idx) => (
                    <div key={idx} className="online-card-item-line">
                      • {itemStr}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Total Paid:</span>
                  <strong style={{ color: 'var(--primary)' }}>฿{o.amount.toFixed(2)}</strong>
                </div>
                {(o.deliveryType || '').toLowerCase() === 'delivery' && o.deliveryAddress ? (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #dbeafe',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: '#1e40af',
                      marginTop: '4px',
                      lineHeight: 1.3,
                    }}
                  >
                    📍 {o.deliveryAddress}
                  </div>
                ) : null}
                {o.orderNotes ? (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: '#b45309',
                      marginTop: '4px',
                      fontWeight: 600,
                    }}
                  >
                    📝 Note: {o.orderNotes}
                  </div>
                ) : null}
                {o.prepTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
                    <Clock size={12} />
                    <span>Prep Time: {o.prepTime} mins</span>
                  </div>
                )}
              </div>

              <div className="online-card-footer">
                {o.status === 'Pending' && (
                  <>
                    <button className="btn-card accept" onClick={(): void => handleAcceptOnlineOrder(o)}>
                      <Check size={16} />
                      <span>Accept</span>
                    </button>
                    <button className="btn-card reject" onClick={(): void => handleRejectOnlineOrder(o)}>
                      <X size={16} />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {o.status === 'Preparing' && (
                  <button className="btn-card primary" onClick={(): void => handleUpdateOnlineStatus(o)}>
                    <Check size={16} />
                    <span>Mark Ready</span>
                  </button>
                )}

                {o.status === 'Ready' && (
                  <button className="btn-card primary" onClick={(): void => handleUpdateOnlineStatus(o)}>
                    <Check size={16} />
                    <span>
                      {(o.deliveryType || '').toLowerCase() === 'delivery'
                        ? 'Out for Delivery'
                        : 'Mark Picked Up'}
                    </span>
                  </button>
                )}

                {o.status === 'OutForDelivery' && (
                  <button className="btn-card primary" onClick={(): void => handleUpdateOnlineStatus(o)}>
                    <Check size={16} />
                    <span>Mark Delivered</span>
                  </button>
                )}

                <button className="btn-card" onClick={(): void => setReceiptOrder(o)}>
                  <Printer size={16} />
                  <span>Print</span>
                </button>
              </div>
            </div>
          ))}
          {activeOnlineOrders.length === 0 && (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px', color: 'var(--text-muted)' }}>
              No incoming online orders found.
            </div>
          )}
        </div>
      </div>

      {/* --- POPUP MODAL: EST prep time --- */}
      {prepTimeOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '350px' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>Set Preparation Time</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Enter estimate preparation time in minutes for <strong>{prepTimeOrder.id}</strong>:
            </p>

            <div className="prep-preset-grid">
              {['10', '15', '20', '30', '45', '60'].map((mins) => (
                <button key={mins} className="prep-preset-btn" onClick={(): void => setPrepTimeInput(mins)}>
                  {mins}m
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="number"
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={prepTimeInput}
                onChange={(e): void => setPrepTimeInput(e.target.value)}
                placeholder="Custom minutes..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirmAccept}>
                Confirm Accept
              </button>
              <button className="logout-btn" style={{ flex: 1 }} onClick={(): void => setPrepTimeOrder(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: Thermal print receipt --- */}
      {receiptOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '360px', padding: '20px' }}>
            <div className="receipt-paper">
              <div className="receipt-header">
                <span className="receipt-store">Aladeen Restaurant</span>
                <div style={{ fontSize: '10px' }}>Bangkok, Thailand</div>
                <div style={{ fontSize: '10px' }}>Online Order Receipt</div>
              </div>
              <div className="receipt-body">
                <div>Date: {receiptOrder.date}</div>
                <div>Ticket: <strong>{receiptOrder.id}</strong></div>
                <div>Type: <strong>{(receiptOrder.deliveryType || receiptOrder.type || 'Online').toUpperCase()}</strong></div>
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
