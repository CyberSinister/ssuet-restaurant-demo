'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLocations } from '@/lib/hooks/use-locations'
import { MapPin, Phone, Globe, Clock, ArrowRight } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

export default function LocationsView() {
  const { data: locations = [], isLoading } = useLocations()
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [cityApi, setCityApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (!cityApi) return
    const onSelect = () => {
      setCanScrollPrev(cityApi.canScrollPrev())
      setCanScrollNext(cityApi.canScrollNext())
    }
    onSelect()
    cityApi.on("select", onSelect)
    cityApi.on("reInit", onSelect)
  }, [cityApi])

  // Unique country names
  const countries = useMemo(() => 
    Array.from(new Set(locations.map(l => l.country))).sort(),
    [locations]
  )

  // Auto-detect country
  useEffect(() => {
    if (!selectedCountry && countries.length > 0) {
      setSelectedCountry(countries[0])
    }
  }, [countries, selectedCountry])

  // Get all unique banner images for the selected country
  const countryBanners = useMemo(() => {
    const images = locations
      .filter(l => l.country === selectedCountry)
      .flatMap(l => l.countryImages || [])
    
    // Fallback if no images provided for this country
    if (images.length === 0) return ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop']
    
    return Array.from(new Set(images))
  }, [locations, selectedCountry])

  // Get city data for the selected country
  const cityData = useMemo(() => {
    const map = new Map<string, { images: string[], count: number }>()
    locations
        .filter(l => l.country === selectedCountry)
        .forEach(l => {
            if (!map.has(l.city)) {
                map.set(l.city, { images: l.cityImages || [], count: 1 })
            } else {
                const current = map.get(l.city)!
                // Merge images and remove duplicates
                const mergedImages = Array.from(new Set([...current.images, ...(l.cityImages || [])]))
                map.set(l.city, { images: mergedImages, count: current.count + 1 })
            }
        })
    
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }))
  }, [locations, selectedCountry])

  // Auto-select first city
  useEffect(() => {
    if (cityData.length > 0 && (!selectedCity || !cityData.find(c => c.name === selectedCity))) {
        setSelectedCity(cityData[0].name)
    }
  }, [cityData, selectedCity])

  // Filter locations for building the cards
  const filteredLocations = useMemo(() => {
    return locations.filter(l => l.country === selectedCountry && l.city === selectedCity)
  }, [locations, selectedCountry, selectedCity])

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <Skeleton className="h-[400px] w-full bg-white/5 rounded-[3rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
      
      {/* Country Exclusive Banner Slider */}
      <div className="relative rounded-[3rem] overflow-hidden group shadow-2xl bg-card border border-border">
        <Carousel className="w-full">
          <CarouselContent>
            {countryBanners.map((img, idx) => (
              <CarouselItem key={`${selectedCountry}-banner-${idx}`}>
                <div className="relative h-[450px] md:h-[600px]">
                  <img 
                    src={img} 
                    className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-700"
                    alt={`${selectedCountry} Banner`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  
                  {/* Banner Content */}
                  <div className="absolute inset-x-0 bottom-0 p-8 md:p-20 text-center space-y-6">
                     <div className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                        {selectedCountry} Edition
                     </div>
                     <h2 className="text-6xl md:text-9xl font-black text-foreground uppercase tracking-tighter leading-none italic drop-shadow-2xl">
                        {selectedCountry}
                     </h2>
                     <p className="text-muted-foreground text-sm md:text-xl max-w-2xl mx-auto font-medium tracking-wide">
                        Experience Broadway flavors across the premium landmarks of {selectedCountry}.
                     </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Hide buttons if only 1 banner image exists for the country */}
          {countryBanners.length > 1 && (
            <>
              <CarouselPrevious className="left-10 h-14 w-14 bg-black/20 hover:bg-primary border-none text-white hover:text-black backdrop-blur-md transition-all sm:flex hidden" />
              <CarouselNext className="right-10 h-14 w-14 bg-black/20 hover:bg-primary border-none text-white hover:text-black backdrop-blur-md transition-all sm:flex hidden" />
            </>
          )}
        </Carousel>

        {/* Global Floating Territory Switcher */}
        <div className="absolute top-10 left-10 z-10 hidden md:block">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-14 min-w-[200px] bg-background/40 backdrop-blur-xl border-border text-foreground rounded-2xl hover:bg-background/60 transition-all cursor-pointer">
                    <div className="flex items-center gap-4 font-black uppercase text-xs tracking-widest px-2">
                        <Globe className="text-accent w-5 h-5" weight="fill" />
                        <SelectValue placeholder="Region" />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                    {countries.map(c => <SelectItem key={c} value={c} className="uppercase text-xs font-black tracking-widest">{c}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Cities Presence - Pure Visual Carousel */}
      <div className="space-y-10 pt-6">
        <div className="px-4 text-center md:text-left space-y-2">
            <div className="text-accent text-[10px] font-black uppercase tracking-[0.5em]">Global Presence</div>
            <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                Explore <span className="text-accent italic">{selectedCountry}</span>
            </h3>
        </div>

        <div className="w-full relative px-10 py-10">
            <Carousel 
              setApi={setCityApi}
              opts={{ align: 'start', loop: false }}
              className="w-full overflow-visible"
            >
              <CarouselContent className="-ml-6 overflow-visible">
                {cityData.map(city => (
                  <CarouselItem key={city.name} className="pl-6 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 overflow-visible">
                    <div className="p-3 overflow-visible">
                      <button
                        onClick={() => setSelectedCity(city.name)}
                        className={cn(
                          "w-full aspect-[4/5] rounded-[2.5rem] transition-all duration-700 relative overflow-hidden group border-2 focus:outline-none",
                          selectedCity === city.name 
                            ? "border-primary scale-[1.08] z-50 shadow-md" 
                            : "border-border hover:border-primary/20 grayscale-[0.8] hover:grayscale-0"
                        )}
                      >
                      <img 
                        src={city.images[0] || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2670&auto=format&fit=crop'} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        alt={city.name}
                      />
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-t transition-opacity duration-700",
                        selectedCity === city.name ? "from-background via-background/20 to-transparent opacity-80" : "from-background/80 to-transparent opacity-60 group-hover:opacity-100"
                      )} />
                      
                      <div className="absolute inset-x-0 bottom-0 p-8 text-center flex flex-col items-center gap-1">
                         <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-700",
                            selectedCity === city.name ? "bg-accent text-accent-foreground rotate-12" : "bg-white/10 text-white"
                         )}>
                            <MapPin weight="fill" size={20} />
                         </div>
                         <h4 className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{city.name}</h4>
                         <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent italic">
                              {city.count} {city.count === 1 ? 'Store' : 'Stores'}
                            </span>
                         </div>
                      </div>
                      
                      {selectedCity === city.name && (
                         <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-accent animate-ping" />
                      )}
                    </button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {canScrollPrev && (
                 <CarouselPrevious className="-left-4 h-14 w-14 bg-card/80 backdrop-blur-xl border-border text-foreground hover:bg-primary hover:text-primary-foreground transition-all" />
              )}
              {canScrollNext && (
                 <CarouselNext className="-right-4 h-14 w-14 bg-card/80 backdrop-blur-xl border-border text-foreground hover:bg-primary hover:text-primary-foreground transition-all" />
              )}
            </Carousel>
        </div>
      </div>

      {/* Selected City branch Grid - Premium Look */}
      <div className="space-y-12">
        <div className="flex items-center gap-8 px-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <h2 className="text-2xl font-black text-muted-foreground uppercase tracking-[0.5em] whitespace-nowrap">
            Available Branches
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4 pb-20">
          {filteredLocations.map((loc: any) => (
            <Card key={loc.id} className="bg-card border-border hover:border-primary/40 transition-all duration-700 overflow-hidden group rounded-[1.5rem] shadow-lg relative">
               <div className="h-32 relative overflow-hidden">
                  <img 
                    src={loc.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop'} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt={loc.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  
                  {/* Branch Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="px-2 py-1 bg-accent text-accent-foreground text-[7px] font-black uppercase rounded shadow-2xl transform -rotate-2">
                        Premium Store
                    </div>
                    {loc.active && (
                       <div className="px-2 py-1 bg-background/40 backdrop-blur-md text-foreground text-[7px] font-black uppercase rounded border border-border shadow-2xl w-max">
                          Open
                       </div>
                    )}
                  </div>
               </div>
               
               <CardHeader className="pt-4 px-4 pb-1">
                  <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-foreground text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors duration-500 leading-tight line-clamp-1">
                        {loc.name}
                      </CardTitle>
                      <div className="p-1.5 rounded-lg bg-muted border border-border text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-500 shrink-0">
                          <MapPin weight="fill" size={12} />
                      </div>
                  </div>
               </CardHeader>
               
               <CardContent className="space-y-4 pb-6 px-4">
                  <div className="flex items-start gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                    <span className="text-[9px] font-medium leading-relaxed italic line-clamp-1">{loc.address}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 pt-4 border-t border-border">
                     {loc.phone && (
                       <div className="flex items-center gap-3 group/info">
                          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center group-hover/info:bg-accent/10 transition-all duration-500 group-hover/info:rotate-12">
                            <Phone className="text-accent w-3.5 h-3.5" weight="fill" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[7px] font-black uppercase tracking-widest text-accent opacity-60 leading-none mb-1">Hotline</span>
                              <span className="font-mono text-xs tracking-tighter text-foreground leading-none">{loc.phone}</span>
                          </div>
                       </div>
                     )}
                     <div className="flex items-center gap-3 group/info">
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center group-hover/info:bg-accent/10 transition-all duration-500 group-hover/info:-rotate-12">
                          <Clock className="text-accent w-3.5 h-3.5" weight="fill" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-widest text-accent opacity-60 leading-none mb-1">Status</span>
                            <span className="font-bold text-[9px] text-foreground/80 tracking-wide uppercase leading-none">11AM - 2AM</span>
                        </div>
                     </div>
                  </div>
                  
                  <button className="w-full py-3 bg-muted hover:bg-primary text-foreground hover:text-primary-foreground font-black uppercase tracking-[0.2em] text-[7px] rounded-lg transition-all duration-500 flex items-center justify-center gap-2">
                    Visit
                    <ArrowRight weight="bold" size={12} />
                  </button>
               </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
