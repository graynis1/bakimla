'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    session,
    status,
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    role: session?.user?.role,
    isCustomer: session?.user?.role === 'CUSTOMER',
    isSalonOwner: session?.user?.role === 'SALON_OWNER',
    isAdmin: session?.user?.role === 'ADMIN',
  }
}
