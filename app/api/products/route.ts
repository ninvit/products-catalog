import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { Product } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')

    const db = await getDatabase()
    const collection = db.collection<Product>('products')

    // Build query
    let query: any = {}
    
    if (category && category !== 'All') {
      query.category = category
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    }

    // Execute query
    let cursor = collection.find(query)
    
    if (limit) {
      cursor = cursor.limit(parseInt(limit))
    }

    const products = await cursor.toArray()

    return NextResponse.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDatabase()
    const collection = db.collection<Product>('products')

    // Get the highest ID to generate next one
    const lastProduct = await collection.findOne({}, { sort: { id: -1 } })
    const nextId = (lastProduct?.id || 0) + 1

    const product: Product = {
      ...body,
      id: nextId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(product)

    return NextResponse.json({
      success: true,
      data: { ...product, _id: result.insertedId }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create product' 
      },
      { status: 500 }
    )
  }
} 