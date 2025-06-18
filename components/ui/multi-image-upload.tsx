"use client"

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Star, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ProductImage } from '@/lib/models'

interface MultiImageUploadProps {
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  maxImages?: number
  disabled?: boolean
}

export function MultiImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  disabled = false 
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const uploadFiles = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Máximo ${maxImages} imagens permitidas`,
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    const newImages: ProductImage[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Erro",
            description: `${file.name} não é uma imagem válida`,
            variant: "destructive"
          })
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Erro",
            description: `${file.name} é muito grande (máximo 5MB)`,
            variant: "destructive"
          })
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            newImages.push({
              id: result.data.id,
              url: result.data.url,
              filename: result.data.filename,
              isPrimary: images.length === 0 && newImages.length === 0, // Primeira imagem é primária
              order: images.length + newImages.length
            })
          }
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages])
        toast({
          title: "Sucesso",
          description: `${newImages.length} imagem(ns) carregada(s) com sucesso`
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao fazer upload das imagens",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      setIsDragging(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFiles(files)
    }
  }, [disabled, images, maxImages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    // Se removemos a imagem primária, definir a primeira restante como primária
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
      updatedImages[0].isPrimary = true
    }
    onImagesChange(updatedImages)
  }

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }))
    onImagesChange(updatedImages)
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images]
    const [movedImage] = updatedImages.splice(fromIndex, 1)
    updatedImages.splice(toIndex, 0, movedImage)
    
    // Atualizar ordem
    updatedImages.forEach((img, index) => {
      img.order = index
    })
    
    onImagesChange(updatedImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Fazendo upload...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              Arraste as imagens aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500">
              Máximo {maxImages} imagens • PNG, JPG até 5MB cada
            </p>
            <p className="text-xs text-gray-400">
              {images.length}/{maxImages} imagens carregadas
            </p>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images
            .sort((a, b) => a.order - b.order)
            .map((image, index) => (
              <Card key={image.id} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.filename}
                      fill
                      className="object-cover rounded"
                    />
                    
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <Badge className="absolute top-1 left-1 bg-green-500 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                    
                    {/* Actions */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Drag Handle */}
                    <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded p-1 cursor-move">
                        <GripVertical className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Set as Primary Button */}
                  {!image.isPrimary && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setPrimaryImage(image.id)}
                    >
                      Definir como Principal
                    </Button>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {image.filename}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
      
      {/* Instructions */}
      {images.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• A primeira imagem (com ⭐) será mostrada como principal no catálogo</p>
          <p>• Clique em "Definir como Principal" para alterar a imagem principal</p>
          <p>• Arraste as imagens para reordenar</p>
        </div>
      )}
    </div>
  )
} 