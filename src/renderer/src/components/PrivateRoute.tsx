import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

interface PrivateRouteProps {
  element: React.ReactElement
}

export default function PrivateRoute({ element }: PrivateRouteProps): React.ReactElement {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return element
}
