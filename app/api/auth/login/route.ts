import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { verifyPassword, generateToken, sanitizeUser, checkRateLimit, resetRateLimit } from '@/lib/auth'
import { User, LoginRequest } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required' 
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      )
    }

    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Check rate limiting by email and IP
    const emailRateCheck = checkRateLimit(`email:${email.toLowerCase()}`, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes
    const ipRateCheck = checkRateLimit(`ip:${clientIp}`, 10, 15 * 60 * 1000) // 10 attempts per 15 minutes per IP

    if (!emailRateCheck || !ipRateCheck) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        },
        { status: 429 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection<User>('users')

    // Find user by email (case insensitive)
    const user = await collection.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      )
    }

    // Verify password with enhanced error handling
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      )
    }

    // Password is correct - reset rate limiting for this user
    resetRateLimit(`email:${email.toLowerCase()}`)

    // Generate JWT token with sanitized user data
    const sanitizedUser = sanitizeUser(user)
    const token = generateToken(sanitizedUser)

    // Update last login time
    await collection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          updatedAt: new Date(),
          lastLogin: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizedUser,
        token
      },
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Error logging in user:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed. Please try again.' 
      },
      { status: 500 }
    )
  }
} 