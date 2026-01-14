'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Image, Tag, Star, Flag, Gear } from '@phosphor-icons/react'
import HeroManagement from '@/lib/components/admin/HeroManagement'
import PromotionsManagement from '@/lib/components/admin/PromotionsManagement'
import FeaturedItemsManagement from '@/lib/components/admin/FeaturedItemsManagement'
import BannersManagement from '@/lib/components/admin/BannersManagement'
import LandingPageSettings from '@/lib/components/admin/LandingPageSettings'

export default function LandingPageManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Landing Page Management</h2>
        <p className="text-muted-foreground">
          Customize your restaurant's landing page content and appearance
        </p>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Hero</span>
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Promotions</span>
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Featured</span>
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Banners</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Gear className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-6">
          <HeroManagement />
        </TabsContent>

        <TabsContent value="promotions" className="mt-6">
          <PromotionsManagement />
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <FeaturedItemsManagement />
        </TabsContent>

        <TabsContent value="banners" className="mt-6">
          <BannersManagement />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <LandingPageSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
