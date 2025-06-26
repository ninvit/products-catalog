import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { User } from '@/lib/models'

export interface AuthenticatedRequest extends NextRequest {
  user?: Omit<User, 'password'>
}

/**
 * Middleware to verify user authentication and admin role
 * @param request - The incoming request
 * @returns Promise<{user: User, error?: never} | {user?: never, error: NextResponse}>
 */
export async function verifyAdminAccess(request: NextRequest): Promise<{
  user: Omit<User, 'password'>
  error?: never
} | {
  user?: never
  error: NextResponse
}> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'Access token is required' 
          },
          { status: 401 }
        )
      }
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired token' 
          },
          { status: 401 }
        )
      }
    }

    // Get user from database to check current role
    const db = await getDatabase()
    const collection = db.collection<User>('users')
    
    const user = await collection.findOne({ id: decoded.userId })
    if (!user) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'User not found' 
          },
          { status: 401 }
        )
      }
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'Admin access required' 
          },
          { status: 403 }
        )
      }
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return { user: userWithoutPassword }

  } catch (error) {
    console.error('Error verifying admin access:', error)
    return {
      error: NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed' 
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware to verify user authentication (any authenticated user)
 * @param request - The incoming request
 * @returns Promise<{user: User, error?: never} | {user?: never, error: NextResponse}>
 */
export async function verifyAuthentication(request: NextRequest): Promise<{
  user: Omit<User, 'password'>
  error?: never
} | {
  user?: never
  error: NextResponse
}> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'Access token is required' 
          },
          { status: 401 }
        )
      }
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired token' 
          },
          { status: 401 }
        )
      }
    }

    // Get user from database
    const db = await getDatabase()
    const collection = db.collection<User>('users')
    
    const user = await collection.findOne({ id: decoded.userId })
    if (!user) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'User not found' 
          },
          { status: 401 }
        )
      }
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return { user: userWithoutPassword }

  } catch (error) {
    console.error('Error verifying authentication:', error)
    return {
      error: NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed' 
        },
        { status: 500 }
      )
    }
  }
} 