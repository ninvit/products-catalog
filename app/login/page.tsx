"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()
  const router = useRouter()
  
  // Refs for secure password handling
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Secure form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Get password directly from input to avoid storing in state longer than necessary
    const passwordValue = passwordRef.current?.value || formData.password
    
    try {
      const success = await login(formData.email, passwordValue)
      
      if (success) {
        // Clear form data immediately after successful login
        setFormData({ email: "", password: "" })
        if (passwordRef.current) {
          passwordRef.current.value = ""
        }
        
        toast({
          title: "Sucesso!",
          description: "Você foi conectado com sucesso.",
        })
        router.push("/")
      } else {
        // Clear password on failed login
        setFormData(prev => ({ ...prev, password: "" }))
        if (passwordRef.current) {
          passwordRef.current.value = ""
        }
        
        toast({
          title: "Erro",
          description: "Email ou senha inválidos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Clear password on error
      setFormData(prev => ({ ...prev, password: "" }))
      if (passwordRef.current) {
        passwordRef.current.value = ""
      }
      
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Clear sensitive data when component unmounts
  const clearSensitiveData = () => {
    setFormData({ email: "", password: "" })
    if (passwordRef.current) {
      passwordRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Products */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6" onClick={clearSensitiveData}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Produtos
        </Link>

        <Card className="shadow-xl">
                      <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Bem-vindo de Volta</CardTitle>
              <CardDescription>Entre na sua conta da BJJ Shop</CardDescription>
            </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-purple-600 hover:underline font-medium" onClick={clearSensitiveData}>
                Criar uma aqui
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 