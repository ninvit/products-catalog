"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, Package, CreditCard, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { useToast } from "@/hooks/use-toast"

// Mock order data - in a real app, this would come from your backend
const mockOrders = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    status: "Delivered",
    total: 299.97,
    items: [
      { name: "Wireless Headphones", quantity: 1, price: 99.99 },
      { name: "Smart Watch", quantity: 1, price: 199.99 }
    ]
  },
  {
    id: "ORD-002", 
    date: "2024-01-10",
    status: "Shipped",
    total: 159.98,
    items: [
      { name: "Coffee Maker", quantity: 1, price: 79.99 },
      { name: "Yoga Mat", quantity: 1, price: 29.99 },
      { name: "Bluetooth Speaker", quantity: 1, price: 49.99 }
    ]
  }
]

export default function Profile() {
  const { state: authState, logout } = useAuth()
  const { state: cartState } = useCart()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  if (!authState.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
          <div className="space-x-4">
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>{authState.user?.firstName} {authState.user?.lastName}</CardTitle>
                <CardDescription>{authState.user?.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <Button
                    variant={activeTab === "overview" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("overview")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    variant={activeTab === "orders" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("orders")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Order History
                  </Button>
                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}  
                    className="w-full justify-start"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{mockOrders.length}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        ${mockOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total Spent</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{cartState.itemCount}</div>
                      <div className="text-sm text-gray-600">Items in Cart</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your most recent purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-semibold">{order.id}</div>
                            <div className="text-sm text-gray-600">{order.date}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                            <div className="font-semibold mt-1">${order.total.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "orders" && (
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View all your past orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{order.id}</h3>
                            <p className="text-gray-600">Ordered on {order.date}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                            <div className="font-bold text-lg mt-1">${order.total.toFixed(2)}</div>
                          </div>
                        </div>
                        <Separator className="mb-4" />
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.name} x{item.quantity}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                        {authState.user?.firstName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                        {authState.user?.lastName}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                      {authState.user?.email}
                    </div>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Account editing is not available in this demo version.
                    </p>
                    <Button variant="outline" disabled>
                      Edit Profile (Demo)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 