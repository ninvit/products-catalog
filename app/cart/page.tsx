"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"

export default function Cart() {
  const { state: cartState, dispatch } = useCart()
  const { state: authState, logout } = useAuth()
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: newQuantity } })
  }

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id })
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart.",
    })
  }

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "save10") {
      setDiscount(0.1)
      toast({
        title: "Promo code applied!",
        description: "You saved 10% on your order.",
      })
    } else if (promoCode.toLowerCase() === "welcome20") {
      setDiscount(0.2)
      toast({
        title: "Promo code applied!",
        description: "You saved 20% on your order.",
      })
    } else {
      toast({
        title: "Invalid promo code",
        description: "Please check your promo code and try again.",
        variant: "destructive",
      })
    }
  }

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

  const subtotal = cartState.total
  const discountAmount = subtotal * discount
  const shipping = subtotal > 100 ? 0 : 9.99
  const tax = (subtotal - discountAmount) * 0.08
  const total = subtotal - discountAmount + shipping + tax

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Continue Shopping</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart</h1>
              
              {/* Mobile Menu */}
              <div className="flex sm:hidden">
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
              
              <div className="hidden sm:block w-20"></div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center">
          <ShoppingBag className="h-16 sm:h-24 w-16 sm:w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6 sm:mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link href="/">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Continue Shopping</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart</h1>
            
            {/* Desktop item count */}
            <div className="hidden sm:block text-sm text-gray-600">
              {cartState.items.length} {cartState.items.length === 1 ? "item" : "items"}
            </div>

            {/* Mobile Menu */}
            <div className="flex sm:hidden">
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
        {/* Mobile item count */}
        <div className="sm:hidden text-center mb-4">
          <p className="text-sm text-gray-600">
            {cartState.items.length} {cartState.items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Cart Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {cartState.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover mx-auto sm:mx-0"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-semibold text-base sm:text-lg">{item.name}</h3>
                        <p className="text-gray-600 text-sm sm:text-base">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="font-semibold text-base sm:text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                    {index < cartState.items.length - 1 && <Separator className="mt-4 sm:mt-6" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm sm:text-base">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Promo Code</label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input 
                      placeholder="Enter code" 
                      value={promoCode} 
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={applyPromoCode} className="w-full sm:w-auto">
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button size="lg" className="w-full text-base">
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
