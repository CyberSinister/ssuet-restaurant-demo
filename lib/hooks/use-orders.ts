import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Order, OrderStatus, CartItem, MenuItem } from '@/lib/types'

// API response types (from Prisma)
interface ApiOrderItem {
  id: string
  quantity: number
  price: number
  specialInstructions: string | null
  menuItem: MenuItem
}

interface ApiCustomer {
  id: string
  name: string
  email: string
  phone: string
}

interface ApiOrder {
  id: string
  customerId: string
  customer: ApiCustomer
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'DRIVE_THRU'
  address: string | null
  notes: string | null
  status: OrderStatus
  subtotal: number
  tax: number
  total: number
  createdAt: string
  updatedAt: string
  orderItems?: ApiOrderItem[]
}

interface PaginatedOrdersResponse {
  data: ApiOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Transform API order to frontend Order type
function transformOrder(apiOrder: ApiOrder): Order {
  return {
    id: apiOrder.id,
    customerName: apiOrder.customer.name,
    customerEmail: apiOrder.customer.email,
    customerPhone: apiOrder.customer.phone,
    orderType: apiOrder.orderType,
    address: apiOrder.address || undefined,
    notes: apiOrder.notes || undefined,
    status: apiOrder.status,
    subtotal: apiOrder.subtotal,
    tax: apiOrder.tax,
    total: apiOrder.total,
    createdAt: new Date(apiOrder.createdAt).getTime(),
    items: (apiOrder.orderItems || []).map((item): CartItem => ({
      menuItem: item.menuItem,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || undefined,
    })),
  }
}

export function useOrders(customerEmail?: string) {
  return useQuery<Order[]>({
    queryKey: ['orders', customerEmail],
    queryFn: async () => {
      const url = customerEmail
        ? `/api/orders?customerEmail=${encodeURIComponent(customerEmail)}`
        : '/api/orders'

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const result: PaginatedOrdersResponse = await response.json()
      return result.data.map(transformOrder)
    },
    refetchInterval: 2000,
  })
}

// Input type for creating orders (matches API schema)
interface CreateOrderInput {
  items: Array<{
    menuItemId: string
    quantity: number
    specialInstructions?: string
  }>
  customerName: string
  customerEmail: string
  customerPhone: string
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'DRIVE_THRU'
  address?: string
  notes?: string
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (order: CreateOrderInput) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create order')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
