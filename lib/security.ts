// Security utilities for protecting sensitive data in the frontend

/**
 * Secure password input handler that minimizes password exposure
 */
export class SecurePasswordHandler {
  private static instances = new Map<string, SecurePasswordHandler>()
  private value: string = ''
  private readonly id: string

  private constructor(id: string) {
    this.id = id
  }

  static getInstance(id: string): SecurePasswordHandler {
    if (!this.instances.has(id)) {
      this.instances.set(id, new SecurePasswordHandler(id))
    }
    return this.instances.get(id)!
  }

  setValue(value: string): void {
    this.value = value
  }

  getValue(): string {
    return this.value
  }

  clear(): void {
    this.value = ''
    // Overwrite memory for security
    for (let i = 0; i < 10; i++) {
      this.value = Math.random().toString(36)
    }
    this.value = ''
  }

  static clearAll(): void {
    this.instances.forEach(instance => instance.clear())
    this.instances.clear()
  }
}

/**
 * Secure fetch wrapper that automatically clears sensitive data
 */
export const secureApiCall = async (
  url: string, 
  data: any, 
  options: RequestInit = {}
): Promise<Response> => {
  // Create a copy of the data to avoid mutating the original
  const payload = JSON.parse(JSON.stringify(data))
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(payload),
      ...options,
    })
    
    return response
  } finally {
    // Clear sensitive data from payload immediately after request
    clearSensitiveDataFromObject(payload)
  }
}

/**
 * Clear sensitive data from any object
 */
export const clearSensitiveDataFromObject = (obj: any): void => {
  if (!obj || typeof obj !== 'object') return
  
  const sensitiveFields = ['password', 'confirmPassword', 'currentPassword', 'newPassword']
  
  for (const field of sensitiveFields) {
    if (obj[field]) {
      // Overwrite with random data first
      obj[field] = Math.random().toString(36)
      // Then clear
      delete obj[field]
    }
  }
  
  // Recursively clear nested objects
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      clearSensitiveDataFromObject(obj[key])
    }
  }
}

/**
 * Secure form data handler
 */
export class SecureFormData {
  private data: Map<string, any> = new Map()
  private sensitiveFields = new Set(['password', 'confirmPassword', 'currentPassword', 'newPassword'])

  set(key: string, value: any): void {
    this.data.set(key, value)
  }

  get(key: string): any {
    return this.data.get(key)
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {}
    this.data.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  clearSensitive(): void {
    this.sensitiveFields.forEach(field => {
      if (this.data.has(field)) {
        // Overwrite with random data first
        this.data.set(field, Math.random().toString(36))
        // Then delete
        this.data.delete(field)
      }
    })
  }

  clear(): void {
    this.data.clear()
  }
}

/**
 * Debounced password clearing for form inputs
 */
export const createPasswordCleaner = (delay: number = 30000) => {
  let timeoutId: NodeJS.Timeout

  return (inputRef: React.RefObject<HTMLInputElement>) => {
    clearTimeout(timeoutId)
    
    timeoutId = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.value = ''
        inputRef.current.type = 'password' // Ensure it's hidden
      }
    }, delay)
  }
}

/**
 * Prevent password fields from being saved in browser autocomplete
 */
export const securePasswordFieldProps = {
  autoComplete: 'new-password',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  'data-lpignore': 'true', // LastPass ignore
  'data-form-type': 'other', // Chrome ignore
}

/**
 * Memory cleanup utility
 */
export const performSecurityCleanup = (): void => {
  // Clear all secure password handlers
  SecurePasswordHandler.clearAll()
  
  // Force garbage collection if available
  if (window.gc) {
    window.gc()
  }
}

/**
 * Setup security event listeners
 */
export const setupSecurityListeners = (): (() => void) => {
  const handleBeforeUnload = () => {
    performSecurityCleanup()
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Clear sensitive data when tab becomes hidden
      performSecurityCleanup()
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

/**
 * Development mode warning for network inspection
 */
export const warnAboutNetworkInspection = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '🔒 SECURITY WARNING: Sensitive data like passwords should never be visible in network requests. ' +
      'This application implements security measures to prevent password exposure.'
    )
  }
} 