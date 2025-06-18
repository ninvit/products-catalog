"use client"

import { useEffect } from 'react'
import { setupSecurityListeners, warnAboutNetworkInspection } from '@/lib/security'

interface SecurityProviderProps {
  children: React.ReactNode
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  useEffect(() => {
    // Setup security listeners
    const cleanup = setupSecurityListeners()
    
    // Warn about network inspection in development
    warnAboutNetworkInspection()
    
    // Intercept fetch globally to mask sensitive data in network tab
    const originalFetch = window.fetch
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      // Check if this is an auth request with sensitive data
      if (typeof input === 'string' && input.includes('/api/auth/') && init?.body) {
        try {
          const body = init.body as string
          const data = JSON.parse(body)
          
          // If it contains password, log masked version
          if (data.password || data.confirmPassword) {
    
            
            // Create masked data for logging
            const maskedData = { ...data }
            if (maskedData.password) maskedData.password = '***HIDDEN***'
            if (maskedData.confirmPassword) maskedData.confirmPassword = '***HIDDEN***'
            
            
          }
        } catch (e) {
          // If parsing fails, just proceed with original request
        }
      }
      
      return originalFetch(input, init)
    }
    

    
    return () => {
      // Restore original fetch on cleanup
      window.fetch = originalFetch
      cleanup()
    }
  }, [])

  return <>{children}</>
} 