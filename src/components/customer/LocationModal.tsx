
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

import { useLocations } from '@/lib/hooks/use-locations'

interface LocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLocationConfirm: (details: { type: 'DELIVERY' | 'TAKEAWAY', country: string, city: string, area: string }) => void
}

export function LocationModal({ open, onOpenChange, onLocationConfirm }: LocationModalProps) {
  const { data: locations = [] } = useLocations()
  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedArea, setSelectedArea] = useState<string>('')

  // Get unique countries
  const countries = Array.from(new Set(locations.map(l => l.country)))

  // Get cities for selected country
  const cities = Array.from(new Set(locations
    .filter(l => l.country === selectedCountry)
    .map(l => l.city)))

  // Get areas for selected city
  const areas = locations
    .filter(l => l.country === selectedCountry && l.city === selectedCity)
    .map(l => l.name)

  const handleConfirm = () => {
    if (selectedCity && selectedArea) {
      onLocationConfirm({
        type: orderType,
        country: selectedCountry || countries[0],
        city: selectedCity,
        area: selectedArea
      })
      onOpenChange(false)
    }
  }

  // Set default country if none selected
  if (!selectedCountry && countries.length > 0) {
    setSelectedCountry(countries[0])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#121212] text-white border-[#333] p-0 overflow-hidden">
        <div className="relative h-40 bg-[url('https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
             <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-lg">
               Start Your Order
             </h2>
           </div>
        </div>

        <div className="p-6 space-y-6">
            {/* Order Type Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-[#1a1a1a] p-1 rounded-lg">
              <button 
                onClick={() => setOrderType('DELIVERY')}
                className={cn(
                  "py-3 text-sm font-bold uppercase rounded-md transition-all",
                  orderType === 'DELIVERY' ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                Delivery
              </button>
              <button 
                onClick={() => setOrderType('TAKEAWAY')}
                className={cn(
                  "py-3 text-sm font-bold uppercase rounded-md transition-all",
                  orderType === 'TAKEAWAY' ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                Pickup
              </button>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs uppercase tracking-wider">Select Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white h-12">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                       {countries.map(country => (
                         <SelectItem key={country} value={country}>{country}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs uppercase tracking-wider">Select City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white h-12">
                      <SelectValue placeholder="Search City..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCity && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-gray-400 text-xs uppercase tracking-wider">Select Area</Label>
                    <Select value={selectedArea} onValueChange={setSelectedArea}>
                      <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white h-12">
                        <SelectValue placeholder="Select Area" />
                      </SelectTrigger>
                       <SelectContent className="bg-[#1a1a1a] border-[#333] text-white h-60">
                        {areas.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </div>

            <Button 
              onClick={handleConfirm}
              disabled={!selectedCity || !selectedArea}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black uppercase text-lg tracking-wider"
            >
              Continue
              <ArrowRight weight="bold" className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
