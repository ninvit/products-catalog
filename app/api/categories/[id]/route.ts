import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { Category } from '@/lib/models'
import { verifyAdminAccess } from '@/lib/admin-middleware'

// GET - Buscar categoria específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection<Category>('categories')
    
    const category = await collection.findOne({ id: categoryId })
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (authResult.error) {
      return authResult.error
    }

    const categoryId = parseInt(params.id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { name, description, isActive } = body
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection<Category>('categories')
    
    // Verificar se a categoria existe
    const existingCategory = await collection.findOne({ id: categoryId })
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Verificar se outro categoria já tem esse nome
    const duplicateCategory = await collection.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      id: { $ne: categoryId }
    })
    
    if (duplicateCategory) {
      return NextResponse.json(
        { success: false, error: 'Category name already exists' },
        { status: 409 }
      )
    }
    
    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date()
    }
    
    const result = await collection.updateOne(
      { id: categoryId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    const updatedCategory = await collection.findOne({ id: categoryId })
    
    return NextResponse.json({
      success: true,
      data: updatedCategory
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE - Remover categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (authResult.error) {
      return authResult.error
    }

    const categoryId = parseInt(params.id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const categoriesCollection = db.collection<Category>('categories')
    const productsCollection = db.collection('products')
    
    // Verificar se a categoria existe
    const category = await categoriesCollection.findOne({ id: categoryId })
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Verificar se existem produtos usando esta categoria
    const productsUsingCategory = await productsCollection.countDocuments({ 
      category: category.name 
    })
    
    if (productsUsingCategory > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category. ${productsUsingCategory} products are using this category.` 
        },
        { status: 409 }
      )
    }
    
    const result = await categoriesCollection.deleteOne({ id: categoryId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
} 