import React, { useState } from 'react'
import { BellRing, ShoppingBag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { setNewIncomingOrderPopup, updateOrderStatusThunk } from '../store/onlineOrdersSlice'
import { printThermalReceipt } from '../utils/printReceipt'

export default function GlobalOrderPopup(): React.JSX.Element | null {
  const dispatch = useDispatch<AppDispatch>()
  const { newIncomingOrderPopup } = useSelector((state: RootState) => state.onlineOrders)

  const [prepTimeInput, setPrepTimeInput] = useState('20')
  const [isSettingPrepTime, setIsSettingPrepTime] = useState(false)

  if (!newIncomingOrderPopup) return null

  const targetId = newIncomingOrderPopup.rawId || newIncomingOrderPopup.id

  const handleConfirmAccept = (): void => {
    const mins = parseInt(prepTimeInput, 10) || 20
    dispatch(updateOrderStatusThunk(targetId, 'Preparing', mins))

    // Automatically trigger thermal print receipt upon accepting order
    printThermalReceipt(newIncomingOrderPopup, mins)

    dispatch(setNewIncomingOrderPopup(null))
    setIsSettingPrepTime(false)
  }

  const handleDismiss = (): void => {
    dispatch(setNewIncomingOrderPopup(null))
    setIsSettingPrepTime(false)
  }

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.75)', zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '420px', padding: '24px', textAlign: 'center', borderTop: '4px solid #f59e0b', borderRadius: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: 'bounce 1s infinite' }}>
          <BellRing size={28} />
        </div>

        <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>
          🎉 New Online Order Received!
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Order Ticket <strong>{newIncomingOrderPopup.id}</strong> from <strong>{newIncomingOrderPopup.customer}</strong>
        </p>

        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '12px', textAlign: 'left', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>
              <ShoppingBag size={14} />
              <span>Order Items:</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: (newIncomingOrderPopup.deliveryType || '').toLowerCase() === 'delivery' ? '#eff6ff' : '#fef3c7',
                color: (newIncomingOrderPopup.deliveryType || '').toLowerCase() === 'delivery' ? '#2563eb' : '#d97706',
                textTransform: 'uppercase',
              }}
            >
              {newIncomingOrderPopup.deliveryType || 'Pickup'}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.5, marginBottom: '8px' }}>
            {newIncomingOrderPopup.items.split(', ').map((itemStr, idx) => (
              <div key={idx} style={{ padding: '2px 0' }}>• {itemStr}</div>
            ))}
          </div>

          {newIncomingOrderPopup.customerPhone ? (
            <div style={{ fontSize: '11.5px', color: '#6b7280', marginBottom: '4px' }}>
              📞 Phone: <strong>{newIncomingOrderPopup.customerPhone}</strong>
            </div>
          ) : null}

          {(newIncomingOrderPopup.deliveryType || '').toLowerCase() === 'delivery' && newIncomingOrderPopup.deliveryAddress ? (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '11.5px',
                color: '#1e40af',
                marginBottom: '8px',
                lineHeight: 1.35,
              }}
            >
              📍 <strong>Delivery Address:</strong> {newIncomingOrderPopup.deliveryAddress}
            </div>
          ) : null}

          {newIncomingOrderPopup.orderNotes ? (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '11.5px',
                color: '#b45309',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              📝 Note: {newIncomingOrderPopup.orderNotes}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #d1d5db', paddingTop: '6px', marginTop: '6px', fontSize: '13px' }}>
            <span style={{ fontWeight: 600 }}>Total Paid:</span>
            <strong style={{ color: '#d97706', fontSize: '14px' }}>฿{newIncomingOrderPopup.amount.toFixed(2)}</strong>
          </div>
        </div>

        {isSettingPrepTime ? (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Select Estimated Preparation Time:
            </p>
            <div className="prep-preset-grid" style={{ marginBottom: '12px' }}>
              {['10', '15', '20', '30', '45', '60'].map((mins) => (
                <button key={mins} className="prep-preset-btn" onClick={(): void => setPrepTimeInput(mins)}>
                  {mins}m
                </button>
              ))}
            </div>
            <input
              type="number"
              className="form-input"
              style={{ padding: '8px 12px', marginBottom: '12px' }}
              value={prepTimeInput}
              onChange={(e): void => setPrepTimeInput(e.target.value)}
              placeholder="Custom minutes..."
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirmAccept}>
                Confirm & Accept
              </button>
              <button className="logout-btn" style={{ flex: 1 }} onClick={(): void => setIsSettingPrepTime(false)}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-primary"
              style={{ flex: 1, padding: '11px', borderRadius: '12px', fontSize: '14px', fontWeight: 700 }}
              onClick={(): void => setIsSettingPrepTime(true)}
            >
              Accept Order
            </button>
            <button
              className="logout-btn"
              style={{ flex: 1, padding: '11px', borderRadius: '12px', fontSize: '14px' }}
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
