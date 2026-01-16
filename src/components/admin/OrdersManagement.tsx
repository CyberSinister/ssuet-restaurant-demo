import { Order, OrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface OrdersManagementProps {
  orders: Order[]
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void
}

const statusOptions: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  PREPARING: { label: 'Preparing', variant: 'default' },
  READY: { label: 'Ready', variant: 'default' },
  SERVED: { label: 'Served', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export default function OrdersManagement({ orders, setOrders }: OrdersManagementProps) {
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((currentOrders) =>
      currentOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
    toast.success(`Order ${orderId} updated to ${statusConfig[newStatus].label}`)
  }

  const activeOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
  const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
        <p className="text-muted-foreground">Orders will appear here when customers place them</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Active Orders ({activeOrders.length})</h3>
          <div className="space-y-4">
            {activeOrders.map(order => (
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
                      onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
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
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="font-medium">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <span>Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
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
                      <span className="text-xl font-semibold">Rs. {order.total.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <Button onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}>
                          Confirm Order
                        </Button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <Button onClick={() => updateOrderStatus(order.id, 'PREPARING')}>
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'PREPARING' && (
                        <Button onClick={() => updateOrderStatus(order.id, 'READY')}>
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'READY' && (
                        <Button onClick={() => updateOrderStatus(order.id, 'COMPLETED')}>
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
          <h3 className="text-xl font-semibold mb-4">Order History ({completedOrders.length})</h3>
          <div className="space-y-4">
            {completedOrders.map(order => (
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
                    <span>{order.customerName} - {order.orderType}</span>
                    <span className="font-semibold">Rs. {order.total.toLocaleString()}</span>
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
