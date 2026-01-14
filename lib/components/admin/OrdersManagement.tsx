'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useOrders, useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import { OrderStatus } from '@/lib/types'

const statusOptions: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
]

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  preparing: { label: 'Preparing', variant: 'default' },
  ready: { label: 'Ready', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export default function OrdersManagement() {
  const { data: orders, isLoading } = useOrders()
  const updateStatusMutation = useUpdateOrderStatus()

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus })
      toast.success(`Order ${orderId} updated to ${statusConfig[newStatus].label}`)
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  if (isLoading) {
    return <OrdersManagementSkeleton />
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
        <p className="text-muted-foreground">
          Orders will appear here when customers place them
        </p>
      </div>
    )
  }

  const activeOrders = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  )
  const completedOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  )

  return (
    <div className="space-y-8">
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Active Orders ({activeOrders.length})
          </h3>
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <Card key={order.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Order {order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(order.createdAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        handleStatusUpdate(order.id, value as OrderStatus)
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusConfig[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="font-medium">
                          {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                        </span>
                        <span>
                          ${((item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No items</p>}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs">{order.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Order Type</p>
                      <Badge variant="outline" className="mt-1">
                        {order.orderType.toUpperCase()}
                      </Badge>
                    </div>
                    {order.address && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Delivery Address</p>
                        <p className="font-medium">{order.address}</p>
                      </div>
                    )}
                    {order.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Special Instructions</p>
                        <p className="font-medium">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total: </span>
                      <span className="text-xl font-semibold">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Confirm Order
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Complete Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedOrders.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Order History ({completedOrders.length})
          </h3>
          <div className="space-y-4">
            {completedOrders.map((order) => (
              <Card key={order.id} className="opacity-70">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Order {order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(order.createdAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant={statusConfig[order.status].variant}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span>
                      {order.customerName} - {order.orderType}
                    </span>
                    <span className="font-semibold">${order.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersManagementSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
