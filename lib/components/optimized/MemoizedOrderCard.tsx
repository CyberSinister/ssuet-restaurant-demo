'use client'

import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface OrderItem {
  id: string
  menuItemId: string
  quantity: number
  price: number
  specialInstructions?: string | null
  menuItem: {
    id: string
    name: string
  }
}

interface Order {
  id: string
  status: string
  orderType: string
  total: number
  createdAt: Date | string
  customer: {
    name: string
    phone: string
  }
  orderItems: OrderItem[]
}

interface MemoizedOrderCardProps {
  order: Order
  onClick?: (orderId: string) => void
  actions?: React.ReactNode
}

const getStatusColor = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'PENDING':
      return 'secondary'
    case 'CONFIRMED':
    case 'PREPARING':
      return 'default'
    case 'READY':
    case 'SERVED':
      return 'outline'
    case 'COMPLETED':
      return 'outline'
    case 'CANCELLED':
      return 'destructive'
    default:
      return 'default'
  }
}

const MemoizedOrderCard = memo<MemoizedOrderCardProps>(
  ({ order, onClick, actions }) => {
    const handleClick = () => {
      if (onClick) {
        onClick(order.id)
      }
    }

    const timeAgo =
      typeof order.createdAt === 'string'
        ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })
        : formatDistanceToNow(order.createdAt, { addSuffix: true })

    return (
      <Card
        className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{timeAgo}</p>
            </div>
            <Badge variant={getStatusColor(order.status)} className="capitalize">
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{order.customer.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{order.customer.phone}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{order.orderType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items:</span>
            <span className="font-medium">{order.orderItems.length}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t">
            <span>Total:</span>
            <span className="text-primary">${order.total.toFixed(2)}</span>
          </div>
          {actions && <div className="pt-2">{actions}</div>}
        </CardContent>
      </Card>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.order.id === nextProps.order.id &&
      prevProps.order.status === nextProps.order.status &&
      prevProps.order.total === nextProps.order.total
    )
  }
)

MemoizedOrderCard.displayName = 'MemoizedOrderCard'

export { MemoizedOrderCard }
