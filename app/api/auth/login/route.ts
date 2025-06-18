import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { verifyPassword, generateToken } from '@/lib/auth'
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

    const db = await getDatabase()
    const collection = db.collection<User>('users')

    // Find user by email
    const user = await collection.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      )
    }

    // Verify password
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

    // Generate JWT token
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }

    const token = generateToken(userWithoutPassword)

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    })

  } catch (error) {
    console.error('Error logging in user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to login user' 
      },
      { status: 500 }
    )
  }
} 