import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from './models'

// Security constants
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const BCRYPT_SALT_ROUNDS = 12 // High security level
const JWT_EXPIRES_IN = '7d'

// Password security requirements
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_REGEX = /^.{6,}$/ // Temporariamente mais flexível

/**
 * Hash a password using bcrypt with salt rounds of 12
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }
  
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

/**
 * Verify a password against a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false
  }
  
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns object with isValid and message
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (!password) {
    return { isValid: false, message: 'A senha é obrigatória' }
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres` 
    }
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve ter pelo menos 6 caracteres'
    }
  }
  
  return { isValid: true, message: 'Senha válida' }
}

/**
 * Generate JWT token for authenticated user
 * @param user - User object without password
 * @returns string - JWT token
 */
export function generateToken(user: Omit<User, 'password'>): string {
  if (!user || !user.id || !user.email) {
    throw new Error('Invalid user data for token generation')
  }
  
  const payload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    iat: Math.floor(Date.now() / 1000) // Issued at time
  }
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  })
}

/**
 * Verify and decode JWT token
 * @param token - JWT token to verify
 * @returns object - Decoded token payload or null if invalid
 */
export function verifyToken(token: string): any {
  if (!token || typeof token !== 'string') {
    return null
  }
  
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns string - Token or null if invalid format
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  return token.length > 0 ? token : null
}

/**
 * Generate a secure random password
 * @param length - Length of password (default: 12)
 * @returns string - Random password
 */
export function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '@$!%*?&'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Check if password is already hashed with bcrypt
 * @param password - Password to check
 * @returns boolean - True if already hashed
 */
export function isPasswordHashed(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false
  }
  
  // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
  return /^\$2[abyxy]?\$/.test(password)
}

/**
 * Sanitize user object by removing sensitive data
 * @param user - User object
 * @returns Sanitized user object
 */
export function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...sanitized } = user
  return sanitized
}

/**
 * Rate limiting helper - simple in-memory store
 * In production, use Redis or similar
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>()

/**
 * Check and update login attempt rate limiting
 * @param identifier - Email or IP address
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns boolean - True if attempt is allowed
 */
export function checkRateLimit(
  identifier: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = new Date()
  const attempt = loginAttempts.get(identifier)
  
  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }
  
  const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime()
  
  if (timeSinceLastAttempt > windowMs) {
    // Reset counter if window has passed
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }
  
  if (attempt.count >= maxAttempts) {
    return false
  }
  
  // Increment counter
  loginAttempts.set(identifier, { 
    count: attempt.count + 1, 
    lastAttempt: now 
  })
  
  return true
}

/**
 * Reset rate limit for identifier
 * @param identifier - Email or IP address
 */
export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier)
} 