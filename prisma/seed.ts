import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Sample data from existing application
const sampleCategories = [
  { name: 'Burgers', description: 'Juicy burgers made with premium ingredients', displayOrder: 1, active: true },
  { name: 'Salads', description: 'Fresh, healthy salads and bowls', displayOrder: 2, active: true },
  { name: 'Pizza', description: 'Hand-tossed pizzas with authentic flavors', displayOrder: 3, active: true },
  { name: 'Sushi', description: 'Fresh sushi rolls and sashimi', displayOrder: 4, active: true },
  { name: 'Pasta', description: 'Traditional Italian pasta dishes', displayOrder: 5, active: true },
  { name: 'Bowls', description: 'Nourishing grain and protein bowls', displayOrder: 6, active: true },
  { name: 'Tacos', description: 'Authentic street-style tacos', displayOrder: 7, active: true },
  { name: 'Indian', description: 'Aromatic curries and traditional Indian cuisine', displayOrder: 8, active: true },
  { name: 'Grill', description: 'BBQ and grilled specialties', displayOrder: 9, active: true },
  { name: 'Desserts', description: 'Sweet treats and indulgent desserts', displayOrder: 10, active: true },
  { name: 'Soups', description: 'Warming soups and broths', displayOrder: 11, active: true },
]

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'admin123',
    10
  )

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@bistrobay.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@bistrobay.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  console.log('Admin user created')

  // Create categories and get their IDs
  const categoryMap = new Map<string, string>()

  for (const category of sampleCategories) {
    const created = await prisma.category.upsert({
      where: { id: `cat-${category.displayOrder}` },
      update: {},
      create: {
        id: `cat-${category.displayOrder}`,
        ...category,
      },
    })
    categoryMap.set(category.name, created.id)
  }

  console.log('Categories created')

  // Create menu items
  const menuItems = [
    {
      name: 'Classic Cheeseburger',
      description: 'Angus beef patty with aged cheddar, lettuce, tomato, and special sauce on a brioche bun',
      price: 14.99,
      category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop',
      dietaryTags: [],
      available: true,
    },
    {
      name: 'Grilled Chicken Caesar',
      description: 'Romaine lettuce, grilled chicken, parmesan, croutons, and house-made Caesar dressing',
      price: 13.99,
      category: 'Salads',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500&h=400&fit=crop',
      dietaryTags: ['Gluten-Free Option'],
      available: true,
    },
    {
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, tomato sauce, basil, and extra virgin olive oil on hand-tossed dough',
      price: 16.99,
      category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&h=400&fit=crop',
      dietaryTags: ['Vegetarian'],
      available: true,
    },
    {
      name: 'Spicy Tuna Roll',
      description: 'Fresh tuna, spicy mayo, cucumber, and avocado rolled in sushi rice and nori',
      price: 12.99,
      category: 'Sushi',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=400&fit=crop',
      dietaryTags: ['Gluten-Free'],
      available: true,
    },
    {
      name: 'Pasta Carbonara',
      description: 'Creamy sauce with pancetta, parmesan, and black pepper over fresh fettuccine',
      price: 15.99,
      category: 'Pasta',
      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=400&fit=crop',
      dietaryTags: [],
      available: true,
    },
    {
      name: 'Vegan Buddha Bowl',
      description: 'Quinoa, roasted chickpeas, avocado, kale, sweet potato, and tahini dressing',
      price: 13.99,
      category: 'Bowls',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
      dietaryTags: ['Vegan', 'Gluten-Free'],
      available: true,
    },
    {
      name: 'Fish Tacos',
      description: 'Beer-battered cod, cabbage slaw, pico de gallo, and chipotle aioli in soft tortillas',
      price: 14.99,
      category: 'Tacos',
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=400&fit=crop',
      dietaryTags: [],
      available: true,
    },
    {
      name: 'Chicken Tikka Masala',
      description: 'Tender chicken in creamy tomato curry sauce served with basmati rice and naan',
      price: 16.99,
      category: 'Indian',
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=400&fit=crop',
      dietaryTags: ['Gluten-Free Option'],
      available: true,
    },
    {
      name: 'BBQ Ribs',
      description: 'Fall-off-the-bone pork ribs with house BBQ sauce, coleslaw, and fries',
      price: 22.99,
      category: 'Grill',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=400&fit=crop',
      dietaryTags: [],
      available: true,
    },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center, vanilla ice cream, and berry compote',
      price: 8.99,
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&h=400&fit=crop',
      dietaryTags: ['Vegetarian'],
      available: true,
    },
    {
      name: 'Greek Salad',
      description: 'Tomatoes, cucumber, red onion, kalamata olives, feta cheese, and oregano dressing',
      price: 11.99,
      category: 'Salads',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&h=400&fit=crop',
      dietaryTags: ['Vegetarian', 'Gluten-Free'],
      available: true,
    },
    {
      name: 'Beef Pho',
      description: 'Vietnamese noodle soup with beef, rice noodles, herbs, and aromatic broth',
      price: 14.99,
      category: 'Soups',
      image: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=500&h=400&fit=crop',
      dietaryTags: ['Gluten-Free'],
      available: true,
    },
  ]

  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.category)
    if (!categoryId) {
      console.warn(`Category not found: ${item.category}`)
      continue
    }

    await prisma.menuItem.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId,
        image: item.image,
        dietaryTags: JSON.stringify(item.dietaryTags),
        available: item.available,
      },
    })
  }

  console.log('Menu items created')

  // Create restaurant settings
  await prisma.restaurantSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      name: 'Bistro Bay',
      phone: '(555) 123-4567',
      email: 'hello@bistrobay.com',
      address: '123 Harbor Street, San Francisco, CA 94102',
      hours: JSON.stringify({
        monday: { open: '11:00', close: '22:00', closed: false },
        tuesday: { open: '11:00', close: '22:00', closed: false },
        wednesday: { open: '11:00', close: '22:00', closed: false },
        thursday: { open: '11:00', close: '22:00', closed: false },
        friday: { open: '11:00', close: '23:00', closed: false },
        saturday: { open: '10:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '21:00', closed: false },
      }),
      deliveryFee: 4.99,
      minimumOrder: 15,
      taxRate: 0.0875,
    },
  })

  console.log('Restaurant settings created')

  // Create sample locations
  const sampleLocations = [
    {
      name: 'Broadway Main',
      code: 'GULBERG',
      address: 'Shop 12, Gulberg Main Blvd',
      city: 'Lahore',
      country: 'Pakistan',
      phone: '042-35870001',
      email: 'gulberg@broadway.com',
      slug: 'broadway-gulberg',
      active: true,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      countryImages: JSON.stringify(['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670']),
      cityImages: JSON.stringify(['https://images.unsplash.com/photo-1544027993-37dbfe43552e?q=80&w=2670']),
    },
    {
      name: 'Defense Phase 6',
      code: 'RAYA',
      address: 'Plot 45, Raya Fairways',
      city: 'Lahore',
      country: 'Pakistan',
      phone: '042-35870002',
      email: 'raya@broadway.com',
      slug: 'broadway-raya',
      active: true,
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
      countryImages: JSON.stringify(['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670']),
      cityImages: JSON.stringify(['https://images.unsplash.com/photo-1544027993-37dbfe43552e?q=80&w=2670']),
    },
    {
      name: 'North Nazimabad',
      code: 'NORTH',
      address: 'Block L, Five Star Chowrangi',
      city: 'Karachi',
      country: 'Pakistan',
      phone: '021-36600001',
      email: 'north@broadway.com',
      slug: 'broadway-north',
      active: true,
      image: 'https://images.unsplash.com/photo-1514315383764-9add60039260?w=800&q=80',
      countryImages: JSON.stringify(['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670']),
      cityImages: JSON.stringify(['https://images.unsplash.com/photo-1623910543666-48eb435a229a?q=80&w=2670']),
    },
  ]

  for (const loc of sampleLocations) {
    await prisma.location.upsert({
      where: { slug: loc.slug },
      update: {},
      create: loc,
    })
  }

  console.log('Sample locations created')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
