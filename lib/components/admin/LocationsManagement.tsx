import { useState, useEffect, useRef } from 'react'
import { Plus, MapPin, Globe, PencilSimple, Trash, ImageSquare as ImageIcon, Info, House, Check } from '@phosphor-icons/react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { OptimizedImage } from '@/lib/components/optimized/OptimizedImage'
import { getWorldCountries, getCitiesOfCountry, getFamousCountryImages, getCityImage } from '@/lib/utils/world-data'
import { cn } from "@/lib/utils"

export default function LocationsManagement() {
  const countryRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setShowCountryResults(false)
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCityResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const { data: locations, isLoading } = useLocations({ includeInactive: true })
  const createMutation = useCreateLocation()
  const updateMutation = useUpdateLocation()
  const deleteMutation = useDeleteLocation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null)

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
    hours: '',
    countryImages: [] as string[],
    cityImages: [] as string[],
  })

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload an image smaller than 5MB.`);
      return;
    }

    setUploading(field)
    const uploadData = new FormData()
    uploadData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        let errorMessage = 'Upload failed';
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } else {
          errorMessage = res.statusText || `Error ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server did not return JSON");
      }

      const { url } = await res.json()
      setFormData(prev => ({ ...prev, image: url }))
      toast.success('Branch Storefront uploaded')
    } catch (error: any) {
      console.error('File upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setUploading(null)
    }
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
      hours: location.hours || '',
      countryImages: location.countryImages || [],
      cityImages: location.cityImages || [],
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setSelectedLocation(null)
    setFormData({
      name: '', address: '', city: '', country: '', phone: '', email: '', slug: '', active: true,
      image: '', hours: '', countryImages: [], cityImages: []
    })
    setCountryOpen(false)
    setCityOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedLocation) {
        updateMutation.mutate({ id: selectedLocation.id, ...formData })
        toast.success('Branch update initiated')
      } else {
        createMutation.mutate(formData)
        toast.success('Branch creation initiated')
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save location')
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading locations...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Location Hub</h2>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Architecting Global Presence</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 font-black text-black uppercase rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
              <Plus weight="bold" className="mr-2" />
              Establish Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-background border-border rounded-[2.5rem] p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                {selectedLocation ? 'Refine Objective' : 'New Deployment'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-0 space-y-0">
              <div className="max-h-[70vh] overflow-y-auto px-8 pb-8 custom-scrollbar">
                <Tabs defaultValue="basics" className="w-full">
                  <TabsList className="bg-muted p-1 rounded-2xl w-full max-w-sm mb-8">
                    <TabsTrigger value="basics" className="rounded-xl flex-1 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary">Intelligence</TabsTrigger>
                    <TabsTrigger value="media" className="rounded-xl flex-1 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary">Media</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basics" className="space-y-6 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest opacity-60">Identification (Name)</Label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Times Square Hub"
                          className="bg-muted border-input h-14 rounded-2xl"
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
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCountry(false)} className="shrink-0 border-input h-14 w-14 rounded-2xl"><X size={20} /></Button>
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
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCity(false)} className="shrink-0 border-[#333] h-14 w-14 rounded-2xl"><X size={20} /></Button>
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
                        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-muted border-input h-14 rounded-2xl" placeholder="+92 XXX XXXXXXX" />
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted border border-input mt-6 md:mt-8 h-14">
                        <Switch checked={formData.active} onCheckedChange={(c) => setFormData({ ...formData, active: c })} />
                        <Label className="uppercase text-[10px] font-black tracking-[0.2em] cursor-pointer opacity-80">{formData.active ? 'Accepting Orders' : 'Store Paused'}</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-8 focus-visible:outline-none pb-4">
                    {/* Branch Specific Image */}
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-primary">
                        <House weight="fill" />
                        Branch Storefront
                      </Label>
                      <div className="relative h-60 rounded-[2rem] bg-muted border-2 border-dashed border-input overflow-hidden group flex items-center justify-center shadow-inner">
                        {formData.image ? (
                          <>
                            <OptimizedImage src={formData.image} alt="Branch Storefront" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="destructive" size="sm" onClick={() => setFormData({ ...formData, image: '' })} className="h-10 px-6 text-[10px] font-black uppercase rounded-xl">Remove</Button>
                              <Label className="h-10 px-6 bg-primary text-black flex items-center justify-center rounded-xl text-[10px] font-black uppercase cursor-pointer">
                                Change
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
                              </Label>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-2xl bg-background/50 text-muted-foreground">
                              <ImageIcon size={40} weight="duotone" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Upload Storefront</p>
                              <p className="text-[8px] text-muted-foreground font-bold uppercase mt-1">PNG, JPG up to 5MB</p>
                            </div>
                            <Label className="cursor-pointer">
                              <div className="mt-2 h-10 px-6 bg-muted hover:bg-primary hover:text-black border border-input rounded-xl text-[10px] font-black uppercase flex items-center transition-all">
                                Select File
                              </div>
                              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
                            </Label>
                          </div>
                        )}
                        {uploading === 'image' && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[10px] uppercase font-black tracking-widest animate-pulse">Uploading Signal...</div>}
                      </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Info weight="fill" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Automation Intelligence</span>
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                        Territory and City profile images are automatically assigned based on your selection to maintain global visual excellence. You only need to provide the branch Storefront image.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end gap-3 p-6 px-8 border-t border-border bg-background">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest">Abort</Button>
                <Button type="submit" className="h-14 px-10 bg-primary text-black hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                  {selectedLocation ? 'Confirm Update' : 'Initialize Execution'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-12 pt-8">
        {Object.entries(groupedLocations).map(([country, cities]: any) => (
          <div key={country} className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Globe className="w-8 h-8" weight="duotone" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-foreground tracking-tight uppercase leading-none">{country}</h3>
                <div className="h-1 w-24 bg-primary rounded-full mt-2" />
              </div>
            </div>

            <div className="pl-0 sm:pl-16 space-y-12">
              {Object.entries(cities).map(([city, branchList]: any) => (
                <div key={city} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{city}</span>
                    <span className="text-[8px] px-3 py-1 rounded-full bg-muted text-primary font-black uppercase">{branchList.length} Units</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {branchList.map((loc: any) => (
                      <Card key={loc.id} className="bg-card border-border group relative overflow-hidden active:scale-[0.98] transition-all rounded-[2.5rem] shadow-2xl hover:border-primary/30">
                        <div className={`absolute top-0 left-0 w-2 h-full ${loc.active ? 'bg-primary' : 'bg-red-500/50'}`} />
                        <CardHeader className="pb-4 pt-8 flex flex-row justify-between items-start px-8">
                          <div className="space-y-2">
                            <CardTitle className="text-foreground text-xl font-black uppercase tracking-tight leading-tight">{loc.name}</CardTitle>
                            {loc.id.toString().startsWith('temp-') ? (
                              <div className="text-[8px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full inline-block bg-primary/10 text-primary animate-pulse">
                                Syncing Node...
                              </div>
                            ) : (
                              <div className={`text-[8px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full inline-block ${loc.active ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                                {loc.active ? 'Active Operation' : 'Paused'}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={() => handleEdit(loc)}>
                              <PencilSimple size={18} weight="bold" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all" onClick={() => setLocationToDelete(loc)}>
                              <Trash size={18} weight="bold" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6 px-8 pb-8">
                          <div className="space-y-4">
                            <div className="flex items-start gap-4 text-muted-foreground">
                              <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary" weight="fill" />
                              <span className="text-[12px] font-bold leading-relaxed">{loc.address}</span>
                            </div>
                            {loc.hours && (
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <Info className="w-5 h-5 shrink-0 text-accent" weight="fill" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{loc.hours}</span>
                              </div>
                            )}
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
          <div className="text-center py-40 bg-muted/30 rounded-[4rem] border border-dashed border-border/60">
            <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <MapPin size={64} className="text-primary opacity-20" weight="duotone" />
            </div>
            <h4 className="text-foreground font-black uppercase text-2xl tracking-tighter">Global Network Offline</h4>
            <p className="text-muted-foreground text-xs mt-3 uppercase tracking-[0.3em] font-bold">Initiate first territory deployment</p>
            <Button className="mt-12 h-16 px-12 font-black text-black uppercase rounded-2xl bg-primary shadow-2xl shadow-primary/30" onClick={() => setIsDialogOpen(true)}>Establish Network</Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!locationToDelete} onOpenChange={(open) => !open && setLocationToDelete(null)}>
        <AlertDialogContent className="bg-background border-border rounded-[3rem] p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tight">Decommission Node?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground pt-4 text-sm font-medium leading-relaxed">
              Are you sure you want to permanently delete <span className="text-foreground font-black underline decoration-primary underline-offset-4">{locationToDelete?.name}</span>? This action will sever all operational data for this hub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-10">
            <AlertDialogCancel className="rounded-[1.5rem] h-14 px-8 font-black uppercase tracking-widest border-border hover:bg-muted">Abort</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[1.5rem] h-14 px-10 font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 border-none shadow-xl shadow-red-500/20"
              onClick={() => {
                if (locationToDelete) {
                  deleteMutation.mutate(locationToDelete.id)
                  setLocationToDelete(null)
                  toast.success('Node decommissioned')
                }
              }}
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}
