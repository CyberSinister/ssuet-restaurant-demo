import { useState } from 'react'
import { RestaurantSettings } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface SettingsManagementProps {
  settings: RestaurantSettings
  setSettings: (settings: RestaurantSettings | ((prev: RestaurantSettings) => RestaurantSettings)) => void
}

export default function SettingsManagement({ settings, setSettings }: SettingsManagementProps) {
  const [formData, setFormData] = useState(settings)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSettings(formData)
    toast.success('Settings updated successfully')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Restaurant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="minimumOrder">Minimum Order ($)</Label>
              <Input
                id="minimumOrder"
                type="number"
                step="0.01"
                value={formData.minimumOrder}
                onChange={(e) => setFormData({ ...formData, minimumOrder: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="taxRate">Tax Rate (decimal, e.g., 0.0875 for 8.75%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.0001"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData.hours).map(([day, hours]) => (
            <div key={day} className="grid grid-cols-4 gap-4 items-center">
              <Label className="capitalize">{day}</Label>
              <Input
                type="time"
                value={hours.open}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hours: {
                      ...formData.hours,
                      [day]: { ...hours, open: e.target.value },
                    },
                  })
                }
                disabled={hours.closed}
              />
              <Input
                type="time"
                value={hours.close}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hours: {
                      ...formData.hours,
                      [day]: { ...hours, close: e.target.value },
                    },
                  })
                }
                disabled={hours.closed}
              />
              <Button
                type="button"
                variant={hours.closed ? 'outline' : 'destructive'}
                size="sm"
                onClick={() =>
                  setFormData({
                    ...formData,
                    hours: {
                      ...formData.hours,
                      [day]: { ...hours, closed: !hours.closed },
                    },
                  })
                }
              >
                {hours.closed ? 'Open' : 'Closed'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full">
        Save Settings
      </Button>
    </form>
  )
}
