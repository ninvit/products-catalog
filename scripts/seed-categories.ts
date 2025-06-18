import 'dotenv/config'
import { getDatabase } from '../lib/mongodb'
import { Category } from '../lib/models'

const initialCategories: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 1,
    name: "Electronics",
    description: "Electronic devices and gadgets",
    isActive: true
  },
  {
    id: 2,
    name: "Home",
    description: "Home and kitchen appliances",
    isActive: true
  },
  {
    id: 3,
    name: "Fashion",
    description: "Clothing, shoes and accessories",
    isActive: true
  },
  {
    id: 4,
    name: "Fitness",
    description: "Sports and fitness equipment",
    isActive: true
  },
  {
    id: 5,
    name: "Beauty",
    description: "Beauty and personal care products",
    isActive: true
  }
]

async function seedCategories() {
  try {
    
    const db = await getDatabase()
    const collection = db.collection<Category>('categories')
    
    // Verificar se já existem categorias
    const existingCategories = await collection.countDocuments()
    
    if (existingCategories > 0) {
      return
    }
    
    // Inserir categorias
    const result = await collection.insertMany(initialCategories.map(category => ({
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    })))
    
  } catch (error) {
  } finally {
    process.exit(0)
  }
}

// Executar o seeding
seedCategories() 