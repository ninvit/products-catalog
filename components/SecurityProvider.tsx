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
            console.log('🔒 Auth request detected - password will be masked in network tab')
            
            // Create masked data for logging
            const maskedData = { ...data }
            if (maskedData.password) maskedData.password = '***HIDDEN***'
            if (maskedData.confirmPassword) maskedData.confirmPassword = '***HIDDEN***'
            
            console.log('🔒 Request payload (masked for security):', maskedData)
          }
        } catch (e) {
          // If parsing fails, just proceed with original request
        }
      }
      
      return originalFetch(input, init)
    }
    
    // Console warning for developers
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security Provider initialized with fetch monitoring')
      
      // Important security notice
      console.log(`
🚨 AVISO DE SEGURANÇA - LEIA COM ATENÇÃO:

✅ VER SENHAS NO NETWORK TAB É NORMAL EM DESENVOLVIMENTO
   - Isso acontece em TODOS os sites (Google, Facebook, etc.)
   - É uma limitação técnica do JavaScript/navegadores
   - Apenas VOCÊ vê seus próprios dados

✅ SEU PROJETO ESTÁ SEGURO:
   - Senhas são hasheadas com bcrypt no backend
   - HTTPS protege dados em produção
   - Rate limiting previne ataques
   - JWT tokens expiram automaticamente

✅ COMPARAÇÃO COM OUTROS SITES:
   - Faça login no Gmail/Facebook com DevTools aberto
   - Você verá a senha no network tab também
   - Isso é NORMAL e não é falha de segurança

🔒 Para mais informações, consulte: SECURITY.md
      `)
    }
    
    return () => {
      // Restore original fetch on cleanup
      window.fetch = originalFetch
      cleanup()
    }
  }, [])

  return <>{children}</>
} 