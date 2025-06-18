import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { hashPassword, generateToken } from '@/lib/auth'
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 6 characters long' 
        },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection<User>('users')

    // Check if user already exists
    const existingUser = await collection.findOne({ email })
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

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser: User = {
      id: nextId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(newUser)

    // Generate JWT token
    const userWithoutPassword = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email
    }

    const token = generateToken(userWithoutPassword)

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register user' 
      },
      { status: 500 }
    )
  }
} 