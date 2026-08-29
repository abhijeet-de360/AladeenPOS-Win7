import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'
import { RootState, AppDispatch } from '../store/store'
import { markAllAsRead, clearNotifications } from '../store/notificationsSlice'
import { LogOut, Maximize2, Search, Bell, BellRing, CheckCheck, Trash2, ShoppingBag } from 'lucide-react'
import VirtualKeyboard from './VirtualKeyboard'

interface HeaderLayoutProps {
  children: React.ReactNode
  pendingOnlineCount?: number
  searchValue?: string
  onSearchChange?: (val: string) => void
}

export default function HeaderLayout({
  children,
  pendingOnlineCount = 0,
  searchValue,
  onSearchChange
}: HeaderLayoutProps): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()

  const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false)

  const handleLogoutClick = (): void => {
    setShowLogoutModal(true)
  }

  const confirmLogout = (): void => {
    setShowLogoutModal(false)
    dispatch(logout())
    navigate('/login')
  }

  const activePath = location.pathname

  return (
    <div className="home-container">
      {/* Top Foodeology-Style Header Bar */}
      <header className="foodeology-header">
        {/* Left: Brand Name */}
        <div className="foodeology-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="foodeology-brand-name">Aladeen</span>
        </div>

        {/* Center: Search input specifically for POS Terminal view */}
        {(activePath === '/' || activePath === '/pos') && onSearchChange && (
          <div className="foodeology-search-wrapper">
            <input
              type="text"
              className="foodeology-search-input"
              placeholder="Search POS items or code..."
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={() => {
                setShowVirtualKeyboard(true)
                if (window.api && (window.api as any).openVirtualKeyboard) {
                  ;(window.api as any).openVirtualKeyboard()
                }
              }}
              onFocus={() => {
                setShowVirtualKeyboard(true)
                if (window.api && (window.api as any).openVirtualKeyboard) {
                  ;(window.api as any).openVirtualKeyboard()
                }
              }}
            />
            <button className="foodeology-search-btn">
              <Search size={18} />
            </button>
            <VirtualKeyboard
              isOpen={showVirtualKeyboard}
              onClose={() => setShowVirtualKeyboard(false)}
              value={searchValue || ''}
              onChange={(val) => onSearchChange(val)}
              title="POS Item Search Keyboard"
            />
          </div>
        )}

        {/* Navigation tabs & Action Buttons */}
        <div className="foodeology-header-actions">
          <button
            className={`foodeology-nav-btn ${activePath === '/' || activePath === '/pos' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <span>POS Terminal</span>
          </button>

          <button
            className={`foodeology-nav-btn ${activePath === '/online-orders' ? 'active' : ''}`}
            onClick={() => navigate('/online-orders')}
          >
            <span>Online Orders</span>
            {pendingOnlineCount > 0 && <span className="badge">{pendingOnlineCount}</span>}
          </button>

          <button
            className={`foodeology-nav-btn ${activePath === '/order-history' ? 'active' : ''}`}
            onClick={() => navigate('/order-history')}
          >
            <span>Order History Log</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="foodeology-icon-btn"
              title="Notifications"
              onClick={(): void => setShowNotifDropdown(!showNotifDropdown)}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {/* Floating Notification Dropdown */}
            {showNotifDropdown && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-title">
                    <BellRing size={16} color="var(--primary)" />
                    <span>Notifications ({notifications.length})</span>
                  </span>
                  {unreadCount > 0 && (
                    <button
                      className="notif-action-btn"
                      onClick={(): void => {
                        dispatch(markAllAsRead())
                      }}
                    >
                      <CheckCheck size={13} style={{ display: 'inline', marginRight: '3px' }} />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="notif-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={(): void => {
                        if (n.type === 'new_order') {
                          navigate('/online-orders')
                        }
                        setShowNotifDropdown(false)
                      }}
                    >
                      <div className={`notif-icon ${n.type}`}>
                        {n.type === 'new_order' ? <BellRing size={16} /> : <ShoppingBag size={16} />}
                      </div>
                      <div className="notif-content">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">{n.timestamp}</div>
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div style={{ padding: '30px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No notifications right now.
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="notif-footer">
                    <button
                      className="notif-action-btn"
                      style={{ color: '#ef4444' }}
                      onClick={(): void => {
                        dispatch(clearNotifications())
                      }}
                    >
                      <Trash2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="foodeology-icon-btn"
            title="Toggle Fullscreen"
            onClick={() => {
              if (window.api && (window.api as any).toggleFullscreen) {
                ;(window.api as any).toggleFullscreen()
              } else if (document.fullscreenElement) {
                void document.exitFullscreen().catch(() => {})
              } else {
                void document.documentElement.requestFullscreen().catch(() => {})
              }
            }}
          >
            <Maximize2 size={18} />
          </button>

          <button className="foodeology-icon-btn logout" title="Sign Out" onClick={handleLogoutClick}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Page Body */}
      <div className="home-body">
        {children}
      </div>

      {/* --- CONFIRMATION DIALOG MODAL: Logout --- */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '360px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <LogOut size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)' }}>
              Confirm Sign Out
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Are you sure you want to sign out of Aladeen POS? Active cart session will be safely saved.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                onClick={confirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
