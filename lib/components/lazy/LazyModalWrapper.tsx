'use client'

import React, { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LazyModalWrapperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
}

const ModalSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
)

export function LazyModalWrapper({
  open,
  onOpenChange,
  title,
  description,
  children,
}: LazyModalWrapperProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <Suspense fallback={<ModalSkeleton />}>{children}</Suspense>
      </DialogContent>
    </Dialog>
  )
}
