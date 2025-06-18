import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { CartItem, Product } from '@/lib/models'

// Middleware to verify JWT token
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = getTokenFromHeader(authHeader)
  
  if (!token) {
    return null
  }
  
  const decoded = verifyToken(token)
  return decoded
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const cartCollection = db.collection<CartItem>('cart')
    const productsCollection = db.collection<Product>('products')

    // Get cart items for user
    const cartItems = await cartCollection.find({ userId: user.userId }).toArray()

    // Get product details for each cart item
    const cartWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await productsCollection.findOne({ id: item.productId })
        return {
          ...item,
          product
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: cartWithProducts
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const cartCollection = db.collection<CartItem>('cart')
    const productsCollection = db.collection<Product>('products')

    // Verify product exists
    const product = await productsCollection.findOne({ id: productId })
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if item already exists in cart
    const existingItem = await cartCollection.findOne({
      userId: user.userId,
      productId
    })

    if (existingItem) {
      // Update quantity
      const result = await cartCollection.updateOne(
        { userId: user.userId, productId },
        { 
          $set: { 
            quantity: existingItem.quantity + quantity,
            updatedAt: new Date()
          }
        }
      )
    } else {
      // Add new item
      const newItem: CartItem = {
        userId: user.userId,
        productId,
        quantity,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await cartCollection.insertOne(newItem)
    }

    return NextResponse.json({
      success: true,
      message: 'Item added to cart'
    })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const cartCollection = db.collection<CartItem>('cart')

    if (quantity <= 0) {
      // Remove item from cart
      await cartCollection.deleteOne({
        userId: user.userId,
        productId
      })
    } else {
      // Update quantity
      await cartCollection.updateOne(
        { userId: user.userId, productId },
        { 
          $set: { 
            quantity,
            updatedAt: new Date()
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cart updated'
    })
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    const db = await getDatabase()
    const cartCollection = db.collection<CartItem>('cart')

    if (productId) {
      // Remove specific item
      await cartCollection.deleteOne({
        userId: user.userId,
        productId: parseInt(productId)
      })
    } else {
      // Clear entire cart
      await cartCollection.deleteMany({
        userId: user.userId
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Item(s) removed from cart'
    })
  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove from cart' },
      { status: 500 }
    )
  }
} 