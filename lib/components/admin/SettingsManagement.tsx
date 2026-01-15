'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Eye, EyeSlash, PaperPlaneTilt } from '@phosphor-icons/react'
import {
  useSettings,
  useUpdateSettings,
  useSMTPConfig,
  useUpdateSMTPConfig,
  useTestSMTPEmail,
} from '@/lib/hooks/use-settings'
import { restaurantSettingsSchema, smtpConfigUpdateSchema } from '@/lib/validations/schemas'
import { z } from 'zod'

export default function SettingsManagement() {
  const { data: settings, isLoading: settingsLoading } = useSettings()
  const { data: smtpConfig, isLoading: smtpLoading } = useSMTPConfig()
  const updateSettings = useUpdateSettings()
  const updateSMTPConfig = useUpdateSMTPConfig()
  const testSMTPEmail = useTestSMTPEmail()

  const [restaurantFormData, setRestaurantFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    deliveryFee: 0,
    minimumOrder: 0,
    taxRate: 0,
    hours: {} as Record<string, { open: string; close: string; closed: boolean }>,
  })

  const [smtpFormData, setSMTPFormData] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    secure: true,
    fromEmail: '',
    fromName: '',
    enabled: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [testEmailDialog, setTestEmailDialog] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (settings) {
      setRestaurantFormData({
        name: settings.name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        deliveryFee: settings.deliveryFee,
        minimumOrder: settings.minimumOrder,
        taxRate: settings.taxRate,
        hours: settings.hours,
      })
    }
  }, [settings])

  useEffect(() => {
    if (smtpConfig) {
      setSMTPFormData({
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: '********',
        secure: smtpConfig.secure,
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName,
        enabled: smtpConfig.enabled,
      })
    }
  }, [smtpConfig])

  const validateRestaurantSettings = () => {
    try {
      restaurantSettingsSchema.parse(restaurantFormData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const validateSMTPSettings = () => {
    try {
      const dataToValidate: Record<string, unknown> = {
        host: smtpFormData.host,
        port: smtpFormData.port,
        username: smtpFormData.username,
        secure: smtpFormData.secure,
        fromEmail: smtpFormData.fromEmail,
        fromName: smtpFormData.fromName,
        enabled: smtpFormData.enabled,
      }

      if (passwordChanged) {
        dataToValidate.password = smtpFormData.password
      }

      smtpConfigUpdateSchema.parse(dataToValidate)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[`smtp_${err.path[0].toString()}`] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRestaurantSettings()) {
      return
    }

    try {
      await updateSettings.mutateAsync(restaurantFormData)
      toast.success('Restaurant settings updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings')
    }
  }

  const handleSMTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateSMTPSettings()) {
      return
    }

    const updateData: Record<string, unknown> = {
      host: smtpFormData.host,
      port: smtpFormData.port,
      username: smtpFormData.username,
      secure: smtpFormData.secure,
      fromEmail: smtpFormData.fromEmail,
      fromName: smtpFormData.fromName,
      enabled: smtpFormData.enabled,
    }

    if (passwordChanged && smtpFormData.password !== '********') {
      updateData.password = smtpFormData.password
    }

    try {
      await updateSMTPConfig.mutateAsync(updateData)
      toast.success('SMTP settings updated successfully')
      setPasswordChanged(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update SMTP settings')
    }
  }

  const handleTestEmail = async () => {
    if (!testEmailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      await testSMTPEmail.mutateAsync(testEmailAddress)
      toast.success('Test email sent successfully!')
      setTestEmailDialog(false)
      setTestEmailAddress('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send test email')
    }
  }

  if (settingsLoading || smtpLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="space-y-6">
      {/* Restaurant Information */}
      <form onSubmit={handleRestaurantSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Information</CardTitle>
            <CardDescription>Basic information about your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={restaurantFormData.name}
                onChange={(e) =>
                  setRestaurantFormData({ ...restaurantFormData, name: e.target.value })
                }
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={restaurantFormData.phone}
                  onChange={(e) =>
                    setRestaurantFormData({ ...restaurantFormData, phone: e.target.value })
                  }
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={restaurantFormData.email}
                  onChange={(e) =>
                    setRestaurantFormData({ ...restaurantFormData, email: e.target.value })
                  }
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={restaurantFormData.address}
                onChange={(e) =>
                  setRestaurantFormData({ ...restaurantFormData, address: e.target.value })
                }
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  step="0.01"
                  value={restaurantFormData.deliveryFee}
                  onChange={(e) =>
                    setRestaurantFormData({
                      ...restaurantFormData,
                      deliveryFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={errors.deliveryFee ? 'border-red-500' : ''}
                />
                {errors.deliveryFee && (
                  <p className="text-sm text-red-500 mt-1">{errors.deliveryFee}</p>
                )}
              </div>
              <div>
                <Label htmlFor="minimumOrder">Minimum Order ($)</Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  step="0.01"
                  value={restaurantFormData.minimumOrder}
                  onChange={(e) =>
                    setRestaurantFormData({
                      ...restaurantFormData,
                      minimumOrder: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={errors.minimumOrder ? 'border-red-500' : ''}
                />
                {errors.minimumOrder && (
                  <p className="text-sm text-red-500 mt-1">{errors.minimumOrder}</p>
                )}
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (e.g., 0.0875 for 8.75%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.0001"
                  value={restaurantFormData.taxRate}
                  onChange={(e) =>
                    setRestaurantFormData({
                      ...restaurantFormData,
                      taxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={errors.taxRate ? 'border-red-500' : ''}
                />
                {errors.taxRate && <p className="text-sm text-red-500 mt-1">{errors.taxRate}</p>}
              </div>
            </div>
            <Button type="submit" disabled={updateSettings.isPending} className="w-full">
              {updateSettings.isPending ? 'Saving...' : 'Save Restaurant Settings'}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>Set your operating hours for each day of the week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const hours = restaurantFormData.hours[day] || { open: '09:00', close: '17:00', closed: false }
            return (
              <div key={day} className="grid grid-cols-12 gap-4 items-center">
                <Label className="capitalize col-span-2">{day}</Label>
                <Input
                  type="time"
                  value={hours.open}
                  onChange={(e) =>
                    setRestaurantFormData({
                      ...restaurantFormData,
                      hours: {
                        ...restaurantFormData.hours,
                        [day]: { ...hours, open: e.target.value },
                      },
                    })
                  }
                  disabled={hours.closed}
                  className="col-span-3"
                />
                <span className="text-center text-muted-foreground col-span-1">to</span>
                <Input
                  type="time"
                  value={hours.close}
                  onChange={(e) =>
                    setRestaurantFormData({
                      ...restaurantFormData,
                      hours: {
                        ...restaurantFormData.hours,
                        [day]: { ...hours, close: e.target.value },
                      },
                    })
                  }
                  disabled={hours.closed}
                  className="col-span-3"
                />
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id={`${day}-closed`}
                    checked={!hours.closed}
                    onCheckedChange={(checked) =>
                      setRestaurantFormData({
                        ...restaurantFormData,
                        hours: {
                          ...restaurantFormData.hours,
                          [day]: { ...hours, closed: !checked },
                        },
                      })
                    }
                  />
                  <Label htmlFor={`${day}-closed`} className="text-sm">
                    {hours.closed ? 'Closed' : 'Open'}
                  </Label>
                </div>
              </div>
            )
          })}
          <Button
            type="button"
            onClick={handleRestaurantSubmit}
            disabled={updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Business Hours'}
          </Button>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <form onSubmit={handleSMTPSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration (SMTP)</CardTitle>
            <CardDescription>Configure SMTP settings for sending order notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="smtp-enabled"
                checked={smtpFormData.enabled}
                onCheckedChange={(checked) =>
                  setSMTPFormData({ ...smtpFormData, enabled: checked })
                }
              />
              <Label htmlFor="smtp-enabled">Enable Email Notifications</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={smtpFormData.host}
                  onChange={(e) => setSMTPFormData({ ...smtpFormData, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className={errors.smtp_host ? 'border-red-500' : ''}
                />
                {errors.smtp_host && <p className="text-sm text-red-500 mt-1">{errors.smtp_host}</p>}
              </div>
              <div>
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={smtpFormData.port}
                  onChange={(e) =>
                    setSMTPFormData({ ...smtpFormData, port: parseInt(e.target.value) || 587 })
                  }
                  className={errors.smtp_port ? 'border-red-500' : ''}
                />
                {errors.smtp_port && <p className="text-sm text-red-500 mt-1">{errors.smtp_port}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-username">Username</Label>
                <Input
                  id="smtp-username"
                  value={smtpFormData.username}
                  onChange={(e) => setSMTPFormData({ ...smtpFormData, username: e.target.value })}
                  className={errors.smtp_username ? 'border-red-500' : ''}
                />
                {errors.smtp_username && (
                  <p className="text-sm text-red-500 mt-1">{errors.smtp_username}</p>
                )}
              </div>
              <div>
                <Label htmlFor="smtp-password">Password</Label>
                <div className="relative">
                  <Input
                    id="smtp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={smtpFormData.password}
                    onChange={(e) => {
                      setSMTPFormData({ ...smtpFormData, password: e.target.value })
                      setPasswordChanged(true)
                    }}
                    className={errors.smtp_password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.smtp_password && (
                  <p className="text-sm text-red-500 mt-1">{errors.smtp_password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="smtp-secure"
                checked={smtpFormData.secure}
                onCheckedChange={(checked) => setSMTPFormData({ ...smtpFormData, secure: checked })}
              />
              <Label htmlFor="smtp-secure">Use Secure Connection (TLS/SSL)</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-from-email">From Email</Label>
                <Input
                  id="smtp-from-email"
                  type="email"
                  value={smtpFormData.fromEmail}
                  onChange={(e) => setSMTPFormData({ ...smtpFormData, fromEmail: e.target.value })}
                  placeholder="noreply@restaurant.com"
                  className={errors.smtp_fromEmail ? 'border-red-500' : ''}
                />
                {errors.smtp_fromEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.smtp_fromEmail}</p>
                )}
              </div>
              <div>
                <Label htmlFor="smtp-from-name">From Name</Label>
                <Input
                  id="smtp-from-name"
                  value={smtpFormData.fromName}
                  onChange={(e) => setSMTPFormData({ ...smtpFormData, fromName: e.target.value })}
                  placeholder="Restaurant Name"
                  className={errors.smtp_fromName ? 'border-red-500' : ''}
                />
                {errors.smtp_fromName && (
                  <p className="text-sm text-red-500 mt-1">{errors.smtp_fromName}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateSMTPConfig.isPending} className="flex-1">
                {updateSMTPConfig.isPending ? 'Saving...' : 'Save SMTP Settings'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestEmailDialog(true)}
                disabled={!smtpFormData.enabled}
              >
                <PaperPlaneTilt className="mr-2" />
                Test Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialog} onOpenChange={setTestEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter an email address to send a test email and verify your SMTP configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-email">Recipient Email</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTestEmailDialog(false)
                  setTestEmailAddress('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTestEmail}
                disabled={testSMTPEmail.isPending}
                className="flex-1"
              >
                {testSMTPEmail.isPending ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
