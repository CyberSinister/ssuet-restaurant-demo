'use client'

import React, { useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string
  showSkeleton?: boolean
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder-food.jpg',
  showSkeleton = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [_error, setError] = useState(false)
  const [imgSrc, setImgSrc] = useState(src)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setError(true)
    setIsLoading(false)
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
    }
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && showSkeleton && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
}
