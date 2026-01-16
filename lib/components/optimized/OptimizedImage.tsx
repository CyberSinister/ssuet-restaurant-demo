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
  fallbackSrc = 'https://placehold.co/600x400/1a1a1a/ffffff?text=No+Image',
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

  const isLocalUpload = typeof imgSrc === 'string' && (imgSrc.startsWith('/uploads') || imgSrc.startsWith('/api/uploads') || imgSrc.includes('placehold.co'))

  return (
    <div className="relative w-full h-full">
      {isLoading && showSkeleton && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {isLocalUpload ? (
        <img
          src={imgSrc as string}
          alt={alt as string}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          style={{ objectFit: props.fill ? 'cover' : undefined, width: '100%', height: '100%' }}
        />
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  )
}
