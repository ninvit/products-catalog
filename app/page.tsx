"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Star, Heart, Search, User, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { searchProducts, fetchCategories } from "@/lib/products"
import { ImageCarousel } from "@/components/ui/image-carousel"

export default function ProductCatalog() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [categories, setCategories] = useState<string[]>(["Todos"])
  const [favorites, setFavorites] = useState<number[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const { toast } = useToast()
  const { state: cartState, dispatch } = useCart()
  const { state: authState, logout } = useAuth()

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesList = await fetchCategories()
        setCategories(categoriesList)
      } catch (error) {
        // Silently fail and use default categories
      }
    }
    loadCategories()
    
    // Debug logo path in production
    console.log('Logo path:', '/alkaim.jpg')
    console.log('Base URL:', window.location.origin)
  }, [])

  // Fetch products when search query or category changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const products = await searchProducts(searchQuery, {
          category: selectedCategory
        })
        setFilteredProducts(products)
      } catch (error) {
        setFilteredProducts([])
        toast({
          title: "Erro",
          description: "Falha ao carregar produtos. Tente novamente.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchQuery, selectedCategory, toast])

  const addToCart = (product: any) => {
    dispatch({ type: 'ADD_TO_CART', payload: product })
    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name} foi adicionado ao seu carrinho.`,
    })
  }

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => 
      prev.includes(productId) 
        ? prev.filter((id) => id !== productId) 
        : [...prev, productId]
    )
  }

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    toast({
      title: "Desconectado",
      description: "Você foi desconectado com sucesso.",
    })
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              {!logoError ? (
                <Image 
                  src="/alkaim.jpg" 
                  alt="Alkaim Logo" 
                  width={40}
                  height={40}
                  className="h-10 w-auto mr-3"
                  priority
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-10 w-10 bg-gray-800 text-white font-bold rounded mr-3">
                  A
                </div>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Alkaim Store</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-900 hover:text-gray-600 font-medium">
                Produtos
              </Link>
              {authState.isLoggedIn && authState.user?.role === 'admin' && (
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  Painel Admin
                </Link>
              )}
              {!authState.isLoggedIn && (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900">
                    Entrar
                  </Link>
                  <Link href="/register" className="text-gray-600 hover:text-gray-900">
                    Cadastrar
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {authState.isLoggedIn && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 hidden lg:block">
                    Bem-vindo, {authState.user?.firstName}!
                  </span>
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              )}
              <Link href="/cart" className="relative">
                <Button variant="outline" size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Carrinho
                  {cartState.itemCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartState.itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-2">
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
              
              {/* Mobile Menu Trigger */}
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
                    {/* User Info */}
                    {authState.isLoggedIn && (
                      <div className="pb-4 border-b">
                        <p className="text-sm text-gray-600 mb-2">
                          Bem-vindo, {authState.user?.firstName}!
                        </p>
                        <Link href="/profile" onClick={closeMobileMenu}>
                          <Button variant="outline" size="sm" className="w-full justify-start mb-2">
                            <User className="h-4 w-4 mr-2" />
                            Perfil
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Navigation Links */}
                      <div className="space-y-2">
                        <Link href="/" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start">
                            Produtos
                          </Button>
                        </Link>
                        
                        {authState.isLoggedIn && authState.user?.role === 'admin' && (
                          <Link href="/admin" onClick={closeMobileMenu}>
                            <Button variant="ghost" className="w-full justify-start">
                              Painel Admin
                            </Button>
                          </Link>
                        )}
                        
                        {!authState.isLoggedIn && (
                          <>
                            <Link href="/login" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start">
                                Entrar
                              </Button>
                            </Link>
                            <Link href="/register" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start">
                                Cadastrar
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>

                    {/* Actions */}
                    {authState.isLoggedIn && (
                      <div className="pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={handleLogout} className="w-full justify-start">
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
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

      {/* Hero Section */}
      <section className="bg-gray-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">
            Alkaim Store
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Nossos melhores produtos de Jiu-Jitsu
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:space-x-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            {searchQuery || selectedCategory !== "Todos" 
              ? `Resultados ${loading ? '...' : `(${filteredProducts.length})`}` 
              : "Produtos em Destaque"
            }
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.slice(1).map((category) => (
              <Badge 
                key={category} 
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer text-xs sm:text-sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 mb-4">
              <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-b-2 border-purple-600 mx-auto"></div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Carregando produtos...</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Aguarde enquanto buscamos os produtos mais recentes.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 sm:h-16 w-12 sm:w-16 mx-auto" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Tente ajustar sua busca ou filtro para encontrar o que procura.
            </p>
            <Button onClick={() => { setSearchQuery(""); setSelectedCategory("Todos") }}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300 flex flex-col">
                <CardContent className="p-0 flex-1">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <Link href={`/product/${product.id}`}>
                      {product.images && product.images.length > 0 ? (
                        <ImageCarousel
                          images={product.images}
                          alt={product.name}
                          className="w-full aspect-square"
                          showThumbnails={false}
                          autoPlay={true}
                          autoPlayInterval={4000}
                        />
                      ) : (
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={300}
                          height={300}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        />
                      )}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white h-8 w-8 p-0"
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(product.id) 
                            ? "fill-red-500 text-red-500" 
                            : "text-gray-600"
                        }`}
                      />
                    </Button>
                    {!product.inStock && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-xs">Fora de Estoque</Badge>
                    )}
                  </div>
                  <div className="p-2 sm:p-4 lg:p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs truncate max-w-[60%]">{product.category}</Badge>
                      <div className="flex items-center flex-shrink-0">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600 ml-1">
                          {product.rating}
                        </span>
                      </div>
                    </div>
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors cursor-pointer line-clamp-2 text-xs sm:text-sm lg:text-base leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2 flex-1 hidden sm:block">
                      {product.description}
                    </p>
                    <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mt-auto">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="text-sm sm:text-lg font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-2 sm:p-4 lg:p-6 pt-0">
                                      <Button
                      className="w-full text-xs sm:text-sm h-8 sm:h-10"
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{product.inStock ? "Adicionar ao Carrinho" : "Fora de Estoque"}</span>
                      <span className="sm:hidden">{product.inStock ? "Adicionar" : "N/D"}</span>
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
