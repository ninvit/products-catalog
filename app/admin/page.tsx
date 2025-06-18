"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Edit, Trash2, Search, Save, X, Upload, Package, BarChart3, TrendingUp, Users, Settings, Home, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { fetchCategories } from "@/lib/products"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"
import { ProductImage, Category } from "@/lib/models"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  image?: string
  images: ProductImage[]
  inStock: boolean
  rating: number
  reviews: number
  createdAt?: Date
  updatedAt?: Date
}

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [categoriesData, setCategoriesData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("products")
  const { toast } = useToast()
  const { state: authState, logout } = useAuth()
  const { state: cartState } = useCart()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    images: [] as ProductImage[],
    inStock: true,
    rating: "5",
    reviews: "0"
  })

  // Fetch categories
  const fetchCategoriesData = async () => {
    try {
      const response = await fetch('/api/categories')
      const result = await response.json()
      
      if (result.success) {
        setCategoriesData(result.data)
        const categoryNames = ["All", ...result.data.map((cat: Category) => cat.name)]
        setCategories(categoryNames)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback para categorias padrão
      setCategories(["All", "Electronics", "Home", "Fashion", "Fitness", "Beauty"])
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'All') params.append('category', selectedCategory)

      const response = await fetch(`/api/products?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setProducts(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Erro",
        description: "Falha ao buscar produtos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategoriesData()
    fetchProducts()
  }, [searchQuery, selectedCategory])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategoriesData()
  }, [])

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

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('🔄 Iniciando upload:', { name: file.name, type: file.type, size: file.size })

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos de imagem são permitidos",
        variant: "destructive"
      })
      return
    }

    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 5MB",
        variant: "destructive"
      })
      return
    }

    setUploadingImage(true)

    try {
      console.log('📦 Criando FormData...')
      const formData = new FormData()
      formData.append('file', file)

      console.log('🚀 Enviando requisição para /api/upload...')
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      console.log('📥 Resposta recebida:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Resultado do upload:', result)

      if (result.success) {
        setFormData(prev => ({ ...prev, image: result.data.url }))
        setImagePreview(result.data.url)
        toast({
          title: "Sucesso",
          description: result.data.type === 'gridfs' 
            ? "Imagem salva no MongoDB GridFS" 
            : "Imagem carregada com sucesso"
        })
      } else {
        throw new Error(result.error || 'Erro desconhecido no servidor')
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error)
      
      let errorMessage = "Falha ao fazer upload da imagem"
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = "Erro de conexão: Servidor pode estar offline ou inacessível"
      } else if (error instanceof Error) {
        errorMessage = `Erro: ${error.message}`
      }
      
      toast({
        title: "Erro no Upload",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
      images: [],
      inStock: true,
      rating: "5",
      reviews: "0"
    })
    setImagePreview("")
    setEditingProduct(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Encontrar a imagem principal ou usar a primeira
      const primaryImage = formData.images.find(img => img.isPrimary) || formData.images[0]
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: primaryImage?.url || formData.image, // Para compatibilidade
        images: formData.images,
        inStock: formData.inStock,
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews)
      }

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingProduct ? "Produto atualizado com sucesso" : "Produto criado com sucesso"
        })
        
        resetForm()
        setIsDialogOpen(false)
        fetchProducts()
      } else {
        throw new Error('Falha ao salvar produto')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar produto",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image || "",
      images: product.images || [],
      inStock: product.inStock,
      rating: product.rating.toString(),
      reviews: product.reviews.toString()
    })
    setImagePreview(product.image || "")
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Produto excluído com sucesso"
        })
        fetchProducts()
      } else {
        throw new Error('Falha ao excluir produto')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir produto",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Store
                </Button>
              </Link>
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Cart ({cartState.itemCount})
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </nav>

            {/* Mobile Menu */}
            <div className="flex md:hidden">
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
                    <div className="pb-4 border-b">
                      <p className="text-sm text-gray-600 mb-2">
                        Welcome, {authState.user?.firstName}!
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Link href="/" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Home className="h-4 w-4 mr-2" />
                          Store
                        </Button>
                      </Link>
                      <Link href="/cart" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Package className="h-4 w-4 mr-2" />
                          Cart ({cartState.itemCount})
                        </Button>
                      </Link>
                    </div>

                    <div className="pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={handleLogout} className="w-full justify-start">
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Stock</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {products.filter(p => p.inStock).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{categories.length - 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {products.length > 0 
                      ? (products.reduce((acc, p) => acc + p.rating, 0) / products.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Product Images</Label>
                  <MultiImageUpload
                    images={formData.images}
                    onImagesChange={(images) => setFormData({...formData, images})}
                    maxImages={5}
                    disabled={uploadingImage}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reviews">Reviews Count</Label>
                    <Input
                      id="reviews"
                      type="number"
                      min="0"
                      value={formData.reviews}
                      onChange={(e) => setFormData({...formData, reviews: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inStock">In Stock</Label>
                    <Select value={formData.inStock.toString()} onValueChange={(value) => setFormData({...formData, inStock: value === 'true'})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    {editingProduct ? 'Update' : 'Create'} Product
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden md:table-cell">Stock</TableHead>
                      <TableHead className="hidden lg:table-cell">Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded overflow-hidden">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{product.name}</p>
                            <p className="text-xs text-gray-500 sm:hidden">{product.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">${product.price.toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={product.inStock ? "default" : "destructive"} className="text-xs">
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {product.rating} ({product.reviews})
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Categories Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">Categories ({categoriesData.length})</h3>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <CategoryForm onSuccess={fetchCategoriesData} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Categories Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {categoriesData.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No categories found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Products</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoriesData.map((category) => (
                          <CategoryRow 
                            key={category.id} 
                            category={category} 
                            onUpdate={fetchCategoriesData}
                            products={products}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Category Form Component
function CategoryForm({ onSuccess, category }: { onSuccess: () => void, category?: Category }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    isActive: category?.isActive ?? true
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: category ? "Category updated successfully" : "Category created successfully"
        })
        onSuccess()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryName">Name</Label>
        <Input
          id="categoryName"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryDescription">Description</Label>
        <Textarea
          id="categoryDescription"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="categoryActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
          className="rounded"
        />
        <Label htmlFor="categoryActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : category ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}

// Category Row Component
function CategoryRow({ category, onUpdate, products }: { 
  category: Category, 
  onUpdate: () => void,
  products: Product[]
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const productCount = products.filter(p => p.category === category.name).length

  const handleDelete = async () => {
    if (productCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This category has ${productCount} products. Remove products first.`,
        variant: "destructive"
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully"
        })
        onUpdate()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          isActive: !category.isActive
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Category ${category.isActive ? 'deactivated' : 'activated'} successfully`
        })
        onUpdate()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-gray-500 sm:hidden">{category.description}</p>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <p className="text-sm text-gray-600">{category.description || '-'}</p>
      </TableCell>
      <TableCell>
        <Badge variant={category.isActive ? "default" : "secondary"}>
          {category.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="text-sm">{productCount} products</span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleStatus}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            {category.isActive ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              <CategoryForm category={category} onSuccess={onUpdate} />
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading || productCount > 0}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
} 