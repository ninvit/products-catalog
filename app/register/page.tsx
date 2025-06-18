"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const { toast } = useToast()
  const { register } = useAuth()
  const router = useRouter()

  // Refs for secure password handling
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Clear sensitive data helper
  const clearSensitiveData = () => {
    setFormData(prev => ({ 
      ...prev, 
      password: "", 
      confirmPassword: "" 
    }))
    if (passwordRef.current) {
      passwordRef.current.value = ""
    }
    if (confirmPasswordRef.current) {
      confirmPasswordRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Get passwords directly from inputs
    const passwordValue = passwordRef.current?.value || formData.password
    const confirmPasswordValue = confirmPasswordRef.current?.value || formData.confirmPassword

    if (passwordValue !== confirmPasswordValue) {
      clearSensitiveData()
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!formData.agreeToTerms) {
      clearSensitiveData()
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      })
      setLoading(false)  
      return
    }

    try {
      // Fazer requisição direta para capturar mensagem de erro específica
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: passwordValue,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Atualizar o contexto de autenticação
        const success = await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: passwordValue,
        })

        // Clear all form data after successful registration
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
        })
        clearSensitiveData()
        
        toast({
          title: "Sucesso!",
          description: "Sua conta foi criada com sucesso.",
        })
        router.push("/")
      } else {
        clearSensitiveData()
        toast({
          title: "Erro no Cadastro",
          description: data.error || "Falha no registro. Verifique os dados e tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      clearSensitiveData()
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o cadastro.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
              <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
              <CardDescription>Junte-se à BJJ Shop e comece a comprar produtos incríveis</CardDescription>
            </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="João"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Silva"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    ref={confirmPasswordRef}
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))
                  }
                />
                <Label htmlFor="agreeToTerms" className="text-sm text-gray-600">
                  Eu concordo com os{" "}
                  <Link href="#" className="text-purple-600 hover:underline">
                    Termos de Serviço
                  </Link>{" "}
                  e{" "}
                  <Link href="#" className="text-purple-600 hover:underline">
                    Política de Privacidade
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando Conta..." : "Criar Conta"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-purple-600 hover:underline font-medium" onClick={clearSensitiveData}>
                Entrar aqui
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
