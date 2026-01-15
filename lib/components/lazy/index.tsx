'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Loading components
const AdminDashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-8 w-64" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-96" />
  </div>
)

const ManagementSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-64" />
  </div>
)

// Lazy loaded admin components
export const LazyAdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard').then((mod) => mod.default),
  {
    loading: () => <AdminDashboardSkeleton />,
    ssr: false, // Admin dashboard doesn't need SSR
  }
)

export const LazyCategoryManagement = dynamic(
  () => import('@/components/admin/CategoryManagement').then((mod) => mod.default),
  {
    loading: () => <ManagementSkeleton />,
    ssr: false,
  }
)

export const LazyMenuManagement = dynamic(
  () => import('@/components/admin/MenuManagement').then((mod) => mod.default),
  {
    loading: () => <ManagementSkeleton />,
    ssr: false,
  }
)

export const LazyOrdersManagement = dynamic(
  () => import('@/components/admin/OrdersManagement').then((mod) => mod.default),
  {
    loading: () => <ManagementSkeleton />,
    ssr: false,
  }
)

export const LazySettingsManagement = dynamic(
  () => import('@/components/admin/SettingsManagement').then((mod) => mod.default),
  {
    loading: () => <ManagementSkeleton />,
    ssr: false,
  }
)

// Generic lazy modal wrapper
export const LazyModal = dynamic(
  () => import('./LazyModalWrapper').then((mod) => mod.LazyModalWrapper),
  {
    loading: () => null,
    ssr: false,
  }
)
