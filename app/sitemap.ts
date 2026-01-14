import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Get all active menu items
  const menuItems = await prisma.menuItem.findMany({
    where: { available: true },
    select: {
      id: true,
      updatedAt: true,
    },
  })

  // Get all active categories
  const categories = await prisma.category.findMany({
    where: { active: true },
    select: {
      id: true,
      updatedAt: true,
    },
  })

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/customer`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/orders`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
  ]

  // Add menu item routes (if you have individual item pages)
  // Commented out as the current app doesn't have individual menu item pages
  // const menuItemRoutes = menuItems.map((item) => ({
  //   url: `${baseUrl}/menu/${item.id}`,
  //   lastModified: item.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }))

  return routes
}
