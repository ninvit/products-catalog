import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { Category } from '@/lib/models'

// GET - Buscar todas as categorias
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection<Category>('categories')
    
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    const filter = activeOnly ? { isActive: true } : {}
    const categories = await collection.find(filter).sort({ name: 1 }).toArray()
    
    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories' 
      },
      { status: 500 }
    )
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category name is required' 
        },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection<Category>('categories')
    
    // Verificar se a categoria já existe
    const existingCategory = await collection.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category already exists' 
        },
        { status: 409 }
      )
    }
    
    // Obter o próximo ID
    const lastCategory = await collection.findOne({}, { sort: { id: -1 } })
    const nextId = (lastCategory?.id || 0) + 1
    
    const category: Category = {
      id: nextId,
      name: name.trim(),
      description: description?.trim() || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await collection.insertOne(category)
    
    return NextResponse.json({
      success: true,
      data: { ...category, _id: result.insertedId }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category' 
      },
      { status: 500 }
    )
  }
} 