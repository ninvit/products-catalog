"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Edit, Trash2, Search, Save, X, Upload, Package, BarChart3, TrendingUp, Users, Settings, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { categories } from "@/lib/products"

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  image?: string
  inStock: boolean
  rating: number
  reviews: number
  createdAt?: Date
  updatedAt?: Date
}

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    image: "",
    inStock: true,
    rating: "5",
    reviews: "0"
  })

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
    fetchProducts()
  }, [searchQuery, selectedCategory])

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setFormData(prev => ({ ...prev, image: result.data.url }))
        setImagePreview(result.data.url)
        toast({
          title: "Sucesso",
          description: "Imagem carregada com sucesso"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Erro",
        description: "Falha ao fazer upload da imagem",
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
      originalPrice: "",
      category: "",
      image: "",
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
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        category: formData.category,
        image: formData.image || "/placeholder.svg",
        inStock: formData.inStock,
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews)
      }

      let response
      if (editingProduct) {
        // Update existing product
        response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        })
      } else {
        // Create new product
        response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        })
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso`
        })
        setIsDialogOpen(false)
        resetForm()
        fetchProducts()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        title: "Erro",
        description: `Falha ao ${editingProduct ? 'atualizar' : 'criar'} produto`,
        variant: "destructive"
      })
    }
  }

  // Handle edit
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      category: product.category,
      image: product.image || "",
      inStock: product.inStock,
      rating: product.rating.toString(),
      reviews: product.reviews.toString()
    })
    setImagePreview(product.image || "")
    setIsDialogOpen(true)
  }

  // Handle delete
  const handleDelete = async (productId: number) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Produto deletado com sucesso"
        })
        fetchProducts()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "Erro",
        description: "Falha ao deletar produto",
        variant: "destructive"
      })
    }
  }

  // Calculate stats
  const totalProducts = products.length
  const inStockProducts = products.filter(p => p.inStock).length
  const outOfStockProducts = totalProducts - inStockProducts
  const avgRating = products.length > 0 ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <Package className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Painel Administrativo
                </h1>
              </div>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  <Home className="h-4 w-4" />
                  <span>Voltar à Loja</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Produtos</h2>
              <p className="text-gray-600">Gerencie seu catálogo de produtos com facilidade</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Nome do Produto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Digite o nome do produto"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Categoria *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat !== 'All').map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Digite a descrição do produto"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-semibold text-gray-700">Preço *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originalPrice" className="text-sm font-semibold text-gray-700">Preço Original</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">Imagem do Produto</Label>
                    <div className="flex flex-col space-y-4">
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 p-1 h-6 w-6"
                            onClick={() => {
                              setImagePreview("")
                              setFormData(prev => ({ ...prev, image: "" }))
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={uploadingImage}
                        />
                        <label htmlFor="image-upload">
                          <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            disabled={uploadingImage}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingImage ? 'Carregando...' : 'Selecionar Imagem'}
                            </span>
                          </Button>
                        </label>
                        <span className="text-sm text-gray-500">
                          JPG, PNG ou GIF (máx. 5MB)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="text-sm font-semibold text-gray-700">Avaliação</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviews" className="text-sm font-semibold text-gray-700">Nº de Avaliações</Label>
                      <Input
                        id="reviews"
                        type="number"
                        min="0"
                        value={formData.reviews}
                        onChange={(e) => setFormData(prev => ({ ...prev, reviews: e.target.value }))}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-3 pt-6">
                      <input
                        type="checkbox"
                        id="inStock"
                        checked={formData.inStock}
                        onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="inStock" className="text-sm font-semibold text-gray-700">Em Estoque</Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={uploadingImage}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingProduct ? 'Atualizar' : 'Criar'} Produto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total de Produtos</p>
                    <p className="text-3xl font-bold text-blue-900">{totalProducts}</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-full">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Em Estoque</p>
                    <p className="text-3xl font-bold text-green-900">{inStockProducts}</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-full">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Fora de Estoque</p>
                    <p className="text-3xl font-bold text-red-900">{outOfStockProducts}</p>
                  </div>
                  <div className="p-3 bg-red-500 rounded-full">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Avaliação Média</p>
                    <p className="text-3xl font-bold text-purple-900">{avgRating}</p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8 bg-white/70 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
                />
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80">
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
                <Badge variant="outline" className="bg-white/80 border-gray-300 text-gray-700 px-3 py-1">
                  Total: {products.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-gray-900">Catálogo de Produtos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Carregando produtos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Nenhum produto encontrado</p>
                <p className="text-gray-500 text-sm">Tente ajustar sua busca ou adicionar um novo produto</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Imagem</TableHead>
                      <TableHead className="font-semibold text-gray-700">Produto</TableHead>
                      <TableHead className="font-semibold text-gray-700">Categoria</TableHead>
                      <TableHead className="font-semibold text-gray-700">Preço</TableHead>
                      <TableHead className="font-semibold text-gray-700">Estoque</TableHead>
                      <TableHead className="font-semibold text-gray-700">Avaliação</TableHead>
                      <TableHead className="font-semibold text-gray-700">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                        <TableCell>
                          <div className="relative">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover shadow-sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="max-w-xs">
                            <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm text-gray-600 truncate">
                              {product.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-gray-900">R$ {product.price.toFixed(2)}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-sm text-gray-500 line-through ml-2">
                                R$ {product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.inStock ? "default" : "destructive"}
                            className={product.inStock ? "bg-green-100 text-green-800 border-green-200" : ""}
                          >
                            {product.inStock ? "Em Estoque" : "Fora de Estoque"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-gray-700">
                              {product.rating}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({product.reviews})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(product.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
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
      </div>
    </div>
  )
} 