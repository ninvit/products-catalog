"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Circle } from 'lucide-react'
import { ProductImage } from '@/lib/models'

interface ImageCarouselProps {
  images: ProductImage[]
  alt: string
  className?: string
  showThumbnails?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function ImageCarousel({ 
  images, 
  alt, 
  className = "",
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Se não há imagens, mostrar placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`relative bg-gray-100 flex items-center justify-center ${className}`}>
        <Image
          src="/placeholder.svg"
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
    )
  }

  // Se há apenas uma imagem, mostrar sem controles
  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={images[0].url}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
    )
  }

  // Ordenar imagens: primária primeiro, depois por ordem
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return a.order - b.order
  })

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isHovered) {
      intervalRef.current = setInterval(nextImage, autoPlayInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay, isHovered, autoPlayInterval])

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <Image
          src={sortedImages[currentIndex].url}
          alt={`${alt} - Imagem ${currentIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          priority={currentIndex === 0}
        />
        




        {/* Image Counter */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {sortedImages.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && sortedImages.length > 1 && (
        <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToImage(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              {image.isPrimary && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                  ★
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Touch/Swipe and Mouse Drag Support */}
      <div 
        className="absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing"
        onTouchStart={(e) => {
          const touchStart = e.touches[0].clientX
          
          const handleTouchEnd = (e: TouchEvent) => {
            const touchEnd = e.changedTouches[0].clientX
            const diff = touchStart - touchEnd
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
              if (diff > 0) {
                nextImage()
              } else {
                prevImage()
              }
            }
            
            document.removeEventListener('touchend', handleTouchEnd)
          }
          
          document.addEventListener('touchend', handleTouchEnd)
        }}
        onMouseDown={(e) => {
          const mouseStart = e.clientX
          
          const handleMouseUp = (e: MouseEvent) => {
            const mouseEnd = e.clientX
            const diff = mouseStart - mouseEnd
            
            if (Math.abs(diff) > 50) { // Minimum drag distance
              if (diff > 0) {
                nextImage()
              } else {
                prevImage()
              }
            }
            
            document.removeEventListener('mouseup', handleMouseUp)
          }
          
          document.addEventListener('mouseup', handleMouseUp)
        }}
      />
    </div>
  )
} 