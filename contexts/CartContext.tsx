"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'

interface Product {
  id: number
  name: string
  price: number
  image: string
  rating: number
  reviews: number
  category: string
  inStock: boolean
  description: string
}

interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems),
          itemCount: calculateItemCount(updatedItems)
        }
      } else {
        const newItems = [...state.items, { ...action.payload, quantity: 1 }]
        return {
          ...state,
          items: newItems,
          total: calculateTotal(newItems),
          itemCount: calculateItemCount(newItems)
        }
      }
    }
    
    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: calculateItemCount(newItems)
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0)
      
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems),
        itemCount: calculateItemCount(updatedItems)
      }
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
        itemCount: 0
      }
    
    case 'LOAD_CART':
      return {
        items: action.payload,
        total: calculateTotal(action.payload),
        itemCount: calculateItemCount(action.payload)
      }
    
    default:
      return state
  }
}

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

const calculateItemCount = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items))
  }, [state.items])

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export type { Product, CartItem } 