import { ObjectId } from 'mongodb'

// Category interface
export interface Category {
  _id?: ObjectId
  id: number
  name: string
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

// Product Image interface
export interface ProductImage {
  id: string
  url: string
  filename: string
  isPrimary: boolean
  order: number
}

// Product interface
export interface Product {
  _id?: ObjectId
  id: number
  name: string
  price: number
  image: string // Mantido para compatibilidade (primeira imagem)
  images: ProductImage[] // Array de múltiplas imagens
  imageId?: string // ID da imagem no GridFS (mantido para compatibilidade)
  rating: number
  reviews: number
  category: string
  inStock: boolean
  description: string
  createdAt?: Date
  updatedAt?: Date
}

// User interface
export interface User {
  _id?: ObjectId
  id: number
  firstName: string
  lastName: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
}

// Cart Item interface
export interface CartItem {
  _id?: ObjectId
  userId: number
  productId: number
  quantity: number
  createdAt?: Date
  updatedAt?: Date
}

// Order interface
export interface Order {
  _id?: ObjectId
  id: string
  userId: number
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress?: Address
  paymentMethod?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  image: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginResponse {
  user: Omit<User, 'password'>
  token: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
} 