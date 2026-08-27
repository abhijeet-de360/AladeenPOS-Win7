import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store/store'
import { loginUser } from '../store/authSlice'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import logoImg from '../assets/logo.png'

export default function LoginScreen() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { loading: isLoading, error: authError } = useSelector((state: RootState) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLoginSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }
    setErrorMessage('')

    try {
      await dispatch(loginUser(email, password))
      navigate('/')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed.')
    }
  }

  return (
    <div className="login-container">
      <div className="window-drag-bar" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo" style={{ background: 'transparent', width: 'auto', height: 'auto' }}>
            <img src={logoImg} alt="Aladeen Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 className="login-title">Aladeen Sign In</h1>
          <p className="login-subtitle">Access POS terminal and online order panel</p>
        </div>

        <form onSubmit={handleLoginSubmit}>
          {(errorMessage || authError) && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
              {errorMessage || authError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="cashier@aladeen.com"
                value={email}
                onChange={(e): void => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e): void => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="login-footer">
          <span>Security warning: authorized staff only.</span>
        </div>
      </div>
    </div>
  )
}
