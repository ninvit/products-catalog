import { Product } from '@/lib/models'

// Categories available in the system
export const categories = [
  "All",
  "Electronics",
  "Home",
  "Fashion",
  "Fitness",
  "Beauty"
]

export interface FilterOptions {
  category?: string
  priceRange?: [number, number]
  inStock?: boolean
  rating?: number
}

// API function to fetch products from MongoDB
export async function fetchProducts(options?: {
  search?: string
  category?: string
  limit?: number
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams()
    if (options?.search) params.append('search', options.search)
    if (options?.category && options.category !== 'All') params.append('category', options.category)
    if (options?.limit) params.append('limit', options.limit.toString())

    const response = await fetch(`/api/products?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      return data.data
    } else {
      throw new Error(data.error || 'Failed to fetch products')
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

// Search products with filters - only from MongoDB
export const searchProducts = async (query: string, filters?: Partial<FilterOptions>): Promise<Product[]> => {
  try {
    return await fetchProducts({
      search: query,
      category: filters?.category
    })
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

// Get single product by ID - only from MongoDB
export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const response = await fetch(`/api/products/${id}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      return data.data
    } else {
      return null
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Get related products - only from MongoDB
export const getRelatedProducts = async (productId: number, limit: number = 4): Promise<Product[]> => {
  try {
    const product = await getProductById(productId)
    if (!product) return []

    const allProducts = await fetchProducts({ category: product.category })
    return allProducts
      .filter(p => p.id !== productId)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

// Get featured products - only from MongoDB
export const getFeaturedProducts = async (limit: number = 6): Promise<Product[]> => {
  try {
    const allProducts = await fetchProducts()
    return allProducts
      .filter(product => product.rating >= 4.5)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

// Get all products - only from MongoDB
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    return await fetchProducts()
  } catch (error) {
    console.error('Error fetching all products:', error)
    return []
  }
}

// Get products by category - only from MongoDB
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    return await fetchProducts({ category })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
} 