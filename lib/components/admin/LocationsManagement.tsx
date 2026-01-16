'use client'

import { useState } from 'react'
import { Plus, MapPin, Globe, Pencil, TrashSimple, Image as ImageIcon, Info, X, Building } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/lib/hooks/use-locations'
import { Location } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LocationsManagement() {
  const { data: locations, isLoading } = useLocations({ includeInactive: true })
  const createMutation = useCreateLocation()
  const updateMutation = useUpdateLocation()
  const deleteMutation = useDeleteLocation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    slug: '',
    active: true,
    image: '',
    countryImages: [] as string[],
    cityImages: [] as string[],
  })

  const [isNewCountry, setIsNewCountry] = useState(false)
  const [isNewCity, setIsNewCity] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  // Helpers to get images for existing country/city
  const getCountryImages = (country: string) => locations?.find(l => l.country === country && l.countryImages)?.countryImages || []
  const getCityImages = (city: string) => locations?.find(l => l.city === city && l.cityImages)?.cityImages || []

  // Get unique countries and cities
  const existingCountries = Array.from(new Set(locations?.map(l => l.country) || []))
  const existingCities = Array.from(new Set(locations?.filter(l => l.country === formData.country).map(l => l.city) || []))

  // Group locations
  const groupedLocations = locations?.reduce((acc: any, loc) => {
    if (!acc[loc.country]) acc[loc.country] = {}
    if (!acc[loc.country][loc.city]) acc[loc.country][loc.city] = []
    acc[loc.country][loc.city].push(loc)
    return acc
  }, {} as Record<string, Record<string, Location[]>>) || {}

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'countryImages' | 'cityImages') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(field)
    const uploadData = new FormData()
    uploadData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      
      if (field === 'image') {
        setFormData(prev => ({ ...prev, image: url }))
      } else {
        setFormData(prev => ({ ...prev, [field]: [...(prev[field] as string[]), url] }))
      }
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setUploading(null)
    }
  }

  const removeImage = (field: 'countryImages' | 'cityImages', urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(url => url !== urlToRemove)
    }))
  }

  const handleEdit = (location: Location) => {
    setSelectedLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      country: location.country,
      phone: location.phone || '',
      email: location.email || '',
      slug: location.slug,
      active: location.active,
      image: location.image || '',
      countryImages: location.countryImages || [],
      cityImages: location.cityImages || [],
    })
    setIsNewCountry(false)
    setIsNewCity(false)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedLocation) {
        await updateMutation.mutateAsync({ id: selectedLocation.id, ...formData })
        toast.success('Location updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Location created')
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save location')
    }
  }

  const resetForm = () => {
    setSelectedLocation(null)
    setFormData({ 
      name: '', address: '', city: '', country: '', phone: '', email: '', slug: '', active: true,
      image: '', countryImages: [], cityImages: []
    })
    setIsNewCountry(false)
    setIsNewCity(false)
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading locations...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">Restaurant Network</h2>
          <p className="text-muted-foreground text-sm">Manage branches, country capitals, and city galleries</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary text-black hover:bg-primary/90 font-bold">
              <Plus className="mr-2" weight="bold" />
              Register Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[750px] bg-background border-border text-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {selectedLocation ? 'Modify Branch' : 'New Branch Registration'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted-foreground/20">
              <Tabs defaultValue="basic" className="space-y-8">
                <TabsList className="bg-muted border-border p-1.5 rounded-2xl w-full grid grid-cols-2 shadow-inner">
                  <TabsTrigger value="basic" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest transition-all">Essential Info</TabsTrigger>
                  <TabsTrigger value="media" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest transition-all">Visual Gallery</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 focus-visible:outline-none">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest opacity-60">Branch Name</Label>
                      <Input 
                        required
                        value={formData.name} 
                        onChange={(e) => {
                          const name = e.target.value
                          setFormData({ 
                            ...formData, 
                            name, 
                            slug: name.toLowerCase()
                              .replace(/[^\w\s-]/g, '')
                              .replace(/\s+/g, '-') 
                          })
                        }}
                        placeholder="e.g. Broadway Pizza - Times Square" 
                        className="bg-muted border-input h-14 rounded-2xl focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest opacity-60">URL Slug</Label>
                      <Input 
                        required
                        value={formData.slug} 
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="times-square" 
                        className="bg-muted border-input h-14 rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest opacity-60">Territory (Country)</Label>
                      {isNewCountry ? (
                        <div className="flex gap-2">
                          <Input 
                            required
                            autoFocus
                            value={formData.country} 
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="Type Country Name" 
                            className="bg-muted border-primary h-14 rounded-2xl"
                          />
                          <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCountry(false)} className="shrink-0 border-input h-14 w-14 rounded-2xl"><X size={20}/></Button>
                        </div>
                      ) : (
                        <Select value={formData.country} onValueChange={(val) => {
                          if (val === 'add-new') {
                            setIsNewCountry(true)
                            setFormData({ ...formData, country: '', countryImages: [] })
                          } else {
                            setFormData({ ...formData, country: val, countryImages: getCountryImages(val) })
                          }
                        }}>
                          <SelectTrigger className="bg-muted border-input text-foreground h-14 rounded-2xl">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            {existingCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            <SelectItem value="add-new" className="text-primary font-black">+ Create New Country</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest opacity-60">Local Hub (City)</Label>
                      {isNewCity ? (
                        <div className="flex gap-2">
                          <Input 
                            required
                            autoFocus
                            value={formData.city} 
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Type City Name" 
                            className="bg-[#1a1a1a] border-primary h-14 rounded-2xl"
                          />
                          <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCity(false)} className="shrink-0 border-[#333] h-14 w-14 rounded-2xl"><X size={20}/></Button>
                        </div>
                      ) : (
                        <Select 
                          disabled={!formData.country} 
                          value={formData.city} 
                          onValueChange={(val) => {
                            if (val === 'add-new') {
                              setIsNewCity(true)
                              setFormData({ ...formData, city: '', cityImages: [] })
                            } else {
                              setFormData({ ...formData, city: val, cityImages: getCityImages(val) })
                            }
                          }}
                        >
                          <SelectTrigger className="bg-muted border-input text-foreground h-14 rounded-2xl">
                            <SelectValue placeholder={formData.country ? "Select City" : "Pick Country First"} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            {existingCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            <SelectItem value="add-new" className="text-primary font-black">+ Create New City</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">Physical Address</Label>
                    <Textarea 
                      required
                      value={formData.address} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address, Landmark, etc." 
                      className="bg-[#1a1a1a] border-[#333] min-h-[100px] rounded-2xl p-4"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest opacity-60">Support/Order Hotline</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-muted border-input h-14 rounded-2xl" placeholder="+92 XXX XXXXXXX"/>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted border border-input mt-6 md:mt-8 h-14">
                      <Switch checked={formData.active} onCheckedChange={(c) => setFormData({ ...formData, active: c })} />
                      <Label className="uppercase text-[10px] font-black tracking-[0.2em] cursor-pointer opacity-80">{formData.active ? 'Accepting Orders' : 'Store Paused'}</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-8 focus-visible:outline-none pb-4">
                  
                  {/* Country Slider Gallery */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-primary">
                            <Globe weight="fill" />
                            Country Gallery (Slider Banners)
                        </Label>
                        <span className="text-[10px] font-bold text-white/30 uppercase">{formData.countryImages.length} Images</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {formData.countryImages.map((url, i) => (
                            <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                <img src={url} className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage('countryImages', url)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} weight="bold" />
                                </button>
                            </div>
                        ))}
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-[#333] flex flex-col items-center justify-center text-white/20 hover:text-primary hover:border-primary/50 transition-all cursor-pointer">
                            <ImageIcon size={24} />
                            <span className="text-[9px] font-black mt-1 uppercase">Add Banner</span>
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'countryImages')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {uploading === 'countryImages' && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[9px]">Uploading...</div>}
                        </div>
                    </div>
                  </div>

                  {/* City Profile Gallery */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-primary">
                            <MapPin weight="fill" />
                            City Profile Gallery (Historic)
                        </Label>
                        <span className="text-[10px] font-bold text-white/30 uppercase">{formData.cityImages.length} Images</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {formData.cityImages.map((url, i) => (
                            <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                <img src={url} className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage('cityImages', url)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} weight="bold" />
                                </button>
                            </div>
                        ))}
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-[#333] flex flex-col items-center justify-center text-white/20 hover:text-primary hover:border-primary/50 transition-all cursor-pointer">
                            <ImageIcon size={24} />
                            <span className="text-[9px] font-black mt-1 uppercase">Add Profile</span>
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'cityImages')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {uploading === 'cityImages' && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[9px]">Uploading...</div>}
                        </div>
                    </div>
                  </div>

                  {/* Branch Specific Image */}
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-primary">
                        <Building weight="fill" />
                        Branch Storefront
                    </Label>
                    <div className="relative h-40 rounded-2xl bg-[#1a1a1a] border-2 border-dashed border-[#333] overflow-hidden group flex items-center justify-center">
                      {formData.image ? (
                        <>
                          <img src={formData.image} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <Button variant="destructive" size="sm" onClick={() => setFormData({...formData, image: ''})} className="h-8 text-[10px] font-black uppercase">Remove</Button>
                             <Label className="h-8 px-3 bg-primary text-black flex items-center justify-center rounded-md text-[10px] font-black uppercase cursor-pointer">
                                Change
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
                             </Label>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-white/20 gap-3">
                          <ImageIcon size={40} weight="duotone" />
                          <div className="text-center">
                              <span className="text-[10px] font-black uppercase block">Upload Branch Visual</span>
                              <span className="text-[8px] opacity-60">Recommended 1200x800</span>
                          </div>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      )}
                      {uploading === 'image' && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs">Uploading...</div>}
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4 text-xs text-primary/80 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                    <Info size={20} weight="fill" className="shrink-0" />
                    <div className="space-y-1">
                        <p className="font-black uppercase text-[10px] tracking-widest">Region Sync Advisory</p>
                        <p className="opacity-70 leading-relaxed font-medium">Any banner image you add here joins the **Global Territory Gallery**. When customers select this country, all branch banners from this region will form a high-end interactive slider.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>

            <div className="p-6 pt-2 border-t border-border shrink-0">
               <Button type="button" onClick={handleSubmit} className="w-full h-16 bg-primary text-black font-black uppercase text-lg tracking-wider rounded-2xl shadow-2xl shadow-primary/10 hover:scale-[1.01] transition-all" disabled={createMutation.isPending || updateMutation.isPending || !!uploading}>
                {selectedLocation ? 'Push Profile Updates' : 'Authorize New Branch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List Rendering */}
      <div className="space-y-12">
        {Object.entries(groupedLocations).map(([country, cities]: any) => (
          <div key={country} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Globe className="w-6 h-6" weight="duotone" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight uppercase">{country}</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-[#2a2a2a] to-transparent" />
            </div>
            
            <div className="pl-0 sm:pl-11 space-y-10">
              {Object.entries(cities).map(([city, branchList]: any) => (
                <div key={city} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{city}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1a1a1a] text-primary font-mono font-bold">{branchList.length} Units</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branchList.map((loc: any) => (
                      <Card key={loc.id} className="bg-card border-border group relative overflow-hidden active:scale-[0.98] transition-all rounded-[2rem] shadow-xl">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${loc.active ? 'bg-primary' : 'bg-red-500'}`} />
                        <CardHeader className="pb-3 pt-6 flex flex-row justify-between items-start px-6">
                           <div className="space-y-1">
                              <CardTitle className="text-foreground text-lg font-black uppercase tracking-tight leading-tight">{loc.name}</CardTitle>
                              <div className={`text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded-lg inline-block ${loc.active ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                                {loc.active ? 'Accepting Orders' : 'Offline'}
                              </div>
                           </div>
                           <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => handleEdit(loc)}>
                                <Pencil size={16} weight="bold" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500/20 hover:text-red-500 hover:bg-red-500/5 transition-colors" onClick={() => { if(confirm('Permanently decommission this branch?')) deleteMutation.mutate(loc.id) }}>
                                <TrashSimple size={16} weight="bold" />
                              </Button>
                           </div>
                        </CardHeader>
                        <CardContent className="space-y-4 px-6 pb-6">
                           <div className="flex items-start gap-3 text-muted-foreground leading-relaxed min-h-[40px]">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" weight="fill" />
                            <span className="text-[11px] font-medium leading-relaxed">{loc.address}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {locations?.length === 0 && (
          <div className="text-center py-32 bg-[#111] rounded-[4rem] border border-dashed border-white/5">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <MapPin size={48} className="text-primary opacity-20" weight="duotone" />
            </div>
            <h4 className="text-white font-black uppercase text-xl tracking-tighter">Global Network Uninitialized</h4>
            <p className="text-white/30 text-xs mt-3 uppercase tracking-widest font-bold">Launch your first territory to begin</p>
            <Button className="mt-10 h-14 px-10 font-black text-black uppercase rounded-2xl bg-primary" onClick={() => setIsDialogOpen(true)}>Initialize Network</Button>
          </div>
        )}
      </div>
    </div>
  )
}
