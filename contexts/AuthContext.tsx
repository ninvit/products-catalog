"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  loading: boolean
}

interface AuthContextType {
  state: AuthState
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Simple secure request function
const makeAuthRequest = async (url: string, data: any) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  return response
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    loading: true
  })

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setState({
          user,
          isLoggedIn: true,
          loading: false
        })
      } catch (error) {
        console.error('Error loading user from localStorage:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Log masked version for debugging
      console.log('🔒 Login attempt with email:', email, 'password: ***HIDDEN***')
      
      const response = await makeAuthRequest('/api/auth/login', { email, password })
      
      const data = await response.json()
      
      if (data.success) {
        setState({
          user: data.data.user,
          isLoggedIn: true,
          loading: false
        })
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('token', data.data.token)
        
        console.log('✅ Login successful')
        return true
      }
      
      console.log('❌ Login failed')
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      // Log masked version for debugging
      console.log('🔒 Registration attempt:', { ...userData, password: '***HIDDEN***' })
      
      const response = await makeAuthRequest('/api/auth/register', userData)
      
      const data = await response.json()
      
      if (data.success) {
        setState({
          user: data.data.user,
          isLoggedIn: true,
          loading: false
        })
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('token', data.data.token)
        
        console.log('✅ Registration successful')
        return true
      }
      
      console.log('❌ Registration failed')
      return false
    } catch (error) {
      console.error('Registration error:', error)
      return false
    }
  }

  const logout = () => {
    setState({
      user: null,
      isLoggedIn: false,
      loading: false
    })
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    console.log('🚪 User logged out')
  }

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export type { User } 