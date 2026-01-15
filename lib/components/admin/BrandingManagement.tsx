'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageSquare, Palette, TextAa, Eye, Sparkle, Layout } from '@phosphor-icons/react'
import LogoManagement from '@/lib/components/admin/LogoManagement'
import ColorManagement from '@/lib/components/admin/ColorManagement'
import TypographyManagement from '@/lib/components/admin/TypographyManagement'
import ThemePreview from '@/lib/components/admin/ThemePreview'
import { Card, CardContent } from '@/components/ui/card'

export default function BrandingManagement() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkle className="w-5 h-5 text-primary" weight="fill" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Identity Engine</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Branding & Experience</h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Control your restaurant's global visual identity. These settings instantly synchronize across your customer storefront and administrative interfaces.
          </p>
        </div>
      </div>

      <Tabs defaultValue="logo" className="w-full">
        <div className="bg-card border border-border p-1 rounded-2xl mb-8 inline-block shadow-sm">
          <TabsList className="bg-transparent border-none gap-2 h-12">
            <TabsTrigger value="logo" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl px-6 transition-all hover:text-foreground">
              <ImageSquare className="w-4 h-4 mr-2" />
              Logo & Identity
            </TabsTrigger>
            <TabsTrigger value="colors" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl px-6 transition-all hover:text-foreground">
              <Palette className="w-4 h-4 mr-2" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl px-6 transition-all hover:text-foreground">
              <TextAa className="w-4 h-4 mr-2" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl px-6 transition-all hover:text-foreground">
              <Eye className="w-4 h-4 mr-2" />
              Live Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <TabsContent value="logo" className="mt-0 focus-visible:outline-none">
              <LogoManagement />
            </TabsContent>

            <TabsContent value="colors" className="mt-0 focus-visible:outline-none">
              <ColorManagement />
            </TabsContent>

            <TabsContent value="typography" className="mt-0 focus-visible:outline-none">
              <TypographyManagement />
            </TabsContent>

            <TabsContent value="preview" className="mt-0 focus-visible:outline-none">
              <ThemePreview />
            </TabsContent>
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-primary" />
                  Quick Info
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-foreground font-medium mb-1">Global Sync</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Changes here update both your website and this dashboard instantly using your custom design system.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-blue-400 font-medium mb-1">Theme Integrity</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Automatically calculates contrast ratios to ensure accessibility and readability.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <h4 className="text-foreground font-bold mb-2">Need Inspiration?</h4>
              <p className="text-muted-foreground text-xs mb-4">
                Check out the Color Presets tab to quickly apply tried-and-tested color schemes.
              </p>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
