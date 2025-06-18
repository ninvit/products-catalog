import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { hashPassword, generateToken, validatePasswordStrength, sanitizeUser } from '@/lib/auth'
import { User, RegisterRequest } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { firstName, lastName, email, password } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'All fields are required' 
        },
        { status: 400 }
      )
    }

    // Validate field lengths and content
    if (firstName.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'First name must be at least 2 characters long' 
        },
        { status: 400 }
      )
    }

    if (lastName.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Last name must be at least 2 characters long' 
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

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: passwordValidation.message 
        },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection<User>('users')

    // Check if user already exists
    const existingUser = await collection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User with this email already exists' 
        },
        { status: 409 }
      )
    }

    // Get next user ID
    const lastUser = await collection.findOne({}, { sort: { id: -1 } })
    const nextId = (lastUser?.id || 0) + 1

    // Hash password with strong security
    const hashedPassword = await hashPassword(password)

    // Create user with sanitized data
    const newUser: User = {
      id: nextId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(newUser)

    if (!result.insertedId) {
      throw new Error('Failed to create user')
    }

    // Generate JWT token with sanitized user data
    const sanitizedUser = sanitizeUser(newUser)
    const token = generateToken(sanitizedUser)

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizedUser,
        token
      },
      message: 'User registered successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error registering user:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register user. Please try again.' 
      },
      { status: 500 }
    )
  }
} 