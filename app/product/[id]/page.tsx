"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Star, Heart, ShoppingCart, Plus, Minus, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { getProductById, getRelatedProducts } from "@/lib/products"
import { Product } from "@/lib/models"
import { ImageCarousel } from "@/components/ui/image-carousel"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()
  const { dispatch, state: cartState } = useCart()
  const { state: authState, logout } = useAuth()

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true)
      try {
        const productId = parseInt(params.id)
        const [productData, relatedData] = await Promise.all([
          getProductById(productId),
          getRelatedProducts(productId)
        ])
        
        setProduct(productData)
        setRelatedProducts(relatedData)
      } catch (error) {
        console.error('Error fetching product data:', error)
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProductData()
  }, [params.id, toast])

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist in our catalog.</p>
          <Link href="/">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch({ type: 'ADD_TO_CART', payload: product })
    }
    toast({
      title: "Added to cart",
      description: `${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to your cart.`,
    })
  }

  const discount = 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Products</span>
              <span className="sm:hidden">Back</span>
            </Link>

            {/* Desktop cart link */}
            <div className="hidden sm:flex items-center space-x-4">
              <Link href="/cart" className="relative">
                <Button variant="outline" size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                  {cartState.itemCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartState.itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex sm:hidden items-center space-x-2">
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="sm">
                  <ShoppingCart className="h-5 w-5" />
                  {cartState.itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartState.itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-4 mt-6">
                    {authState.isLoggedIn && (
                      <div className="pb-4 border-b">
                        <p className="text-sm text-gray-600 mb-2">
                          Welcome, {authState.user?.firstName}!
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Link href="/" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start">
                          Products
                        </Button>
                      </Link>
                      
                      {authState.isLoggedIn && (
                        <Link href="/admin" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start">
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      
                      {!authState.isLoggedIn && (
                        <>
                          <Link href="/login" onClick={closeMobileMenu}>
                            <Button variant="ghost" className="w-full justify-start">
                              Login
                            </Button>
                          </Link>
                          <Link href="/register" onClick={closeMobileMenu}>
                            <Button variant="ghost" className="w-full justify-start">
                              Register
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>

                    {authState.isLoggedIn && (
                      <div className="pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={handleLogout} className="w-full justify-start">
                          Logout
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
              {product.images && product.images.length > 0 ? (
                <ImageCarousel
                  images={product.images}
                  alt={product.name}
                  className="w-full h-full"
                  showThumbnails={true}
                  autoPlay={false}
                />
              ) : (
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              )}
              {!product.inStock && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-xs z-10">Out of Stock</Badge>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-green-500 text-xs z-10">{discount}% OFF</Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2 text-xs">{product.category}</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
              </div>

              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
                {product.description}
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="w-full sm:w-auto"
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${
                      isFavorite ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  Add to Wishlist
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <Card key={relatedProduct.id} className="group hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <CardContent className="p-0 flex-1">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <Link href={`/product/${relatedProduct.id}`}>
                        {relatedProduct.images && relatedProduct.images.length > 0 ? (
                          <ImageCarousel
                            images={relatedProduct.images}
                            alt={relatedProduct.name}
                            className="w-full aspect-square"
                            showThumbnails={false}
                            autoPlay={true}
                            autoPlayInterval={5000}
                          />
                        ) : (
                          <Image
                            src={relatedProduct.image || "/placeholder.svg"}
                            alt={relatedProduct.name}
                            width={250}
                            height={250}
                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          />
                        )}
                      </Link>
                    </div>
                    <div className="p-2 sm:p-4 flex-1 flex flex-col">
                      <Badge variant="outline" className="mb-2 text-xs truncate">{relatedProduct.category}</Badge>
                      <Link href={`/product/${relatedProduct.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors cursor-pointer line-clamp-2 text-xs sm:text-sm leading-tight flex-1">
                          {relatedProduct.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm sm:text-lg font-bold text-gray-900">
                          ${relatedProduct.price.toFixed(2)}
                        </span>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600 ml-1">
                            {relatedProduct.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 