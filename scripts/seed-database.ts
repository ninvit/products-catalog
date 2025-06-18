import 'dotenv/config'
import { getDatabase } from '../lib/mongodb'
import { Product } from '../lib/models'

const initialProducts: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 99.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.5,
    reviews: 128,
    category: "Electronics",
    inStock: true,
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life. Experience crystal-clear audio quality with deep bass and crisp highs.",
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.8,
    reviews: 89,
    category: "Electronics",
    inStock: true,
    description: "Advanced fitness tracking with heart rate monitoring, GPS, and smartphone notifications. Water-resistant design perfect for all activities.",
  },
  {
    id: 3,
    name: "Coffee Maker",
    price: 79.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.3,
    reviews: 156,
    category: "Home",
    inStock: true,
    description: "Programmable drip coffee maker with thermal carafe. Brew up to 12 cups of delicious coffee with customizable strength settings.",
  },
  {
    id: 4,
    name: "Yoga Mat",
    price: 29.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.6,
    reviews: 203,
    category: "Fitness",
    inStock: true,
    description: "Non-slip premium yoga mat with excellent cushioning and durability. Includes carrying strap and alignment guides.",
  },
  {
    id: 5,
    name: "Bluetooth Speaker",
    price: 49.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.4,
    reviews: 94,
    category: "Electronics",
    inStock: false,
    description: "Portable waterproof speaker with 12-hour battery life and 360-degree sound. Perfect for outdoor adventures and home entertainment.",
  },
  {
    id: 6,
    name: "Running Shoes",
    price: 89.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.7,
    reviews: 167,
    category: "Fashion",
    inStock: true,
    description: "Lightweight running shoes with advanced cushioning technology and breathable mesh upper. Designed for comfort and performance.",
  },
  {
    id: 7,
    name: "Desk Lamp",
    price: 34.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.2,
    reviews: 78,
    category: "Home",
    inStock: true,
    description: "LED desk lamp with adjustable brightness and color temperature. USB charging port and touch controls for modern workspace.",
  },
  {
    id: 8,
    name: "Backpack",
    price: 59.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.5,
    reviews: 134,
    category: "Fashion",
    inStock: true,
    description: "Durable laptop backpack with multiple compartments and padded straps. Water-resistant material with anti-theft zipper design.",
  },
  {
    id: 9,
    name: "Air Purifier",
    price: 149.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.6,
    reviews: 201,
    category: "Home",
    inStock: true,
    description: "HEPA air purifier removes 99.97% of allergens and pollutants. Quiet operation with smart sensor and app control.",
  },
  {
    id: 10,
    name: "Protein Powder",
    price: 39.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.4,
    reviews: 312,
    category: "Fitness",
    inStock: true,
    description: "Premium whey protein powder with 25g protein per serving. Available in multiple flavors with no artificial additives.",
  },
  {
    id: 11,
    name: "Gaming Mouse",
    price: 69.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.7,
    reviews: 156,
    category: "Electronics",
    inStock: true,
    description: "High-precision gaming mouse with customizable RGB lighting and programmable buttons. Ergonomic design for extended gaming sessions.",
  },
  {
    id: 12,
    name: "Skincare Set",
    price: 79.99,
    image: "/placeholder.svg?height=300&width=300",
    images: [],
    rating: 4.3,
    reviews: 89,
    category: "Beauty",
    inStock: true,
    description: "Complete skincare routine with cleanser, toner, and moisturizer. Natural ingredients suitable for all skin types.",
  }
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    const db = await getDatabase()
    const collection = db.collection<Product>('products')
    
    // Clear existing products
    console.log('🗑️ Clearing existing products...')
    await collection.deleteMany({})
    
    // Insert new products
    console.log('📦 Inserting products...')
    const result = await collection.insertMany(initialProducts.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    })))
    
    console.log(`✅ Successfully seeded ${result.insertedCount} products`)
    
    // Display inserted products
    const products = await collection.find({}).toArray()
    console.log('\n📋 Inserted products:')
    products.forEach(product => {
      console.log(`  - ${product.name} ($${product.price}) [${product.category}]`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    process.exit(0)
  }
}

// Run the seeding
seedDatabase() 