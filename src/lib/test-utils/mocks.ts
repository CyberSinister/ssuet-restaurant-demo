import { http, HttpResponse } from 'msw'
import { mockCategories, mockMenuItems, createMockOrder } from './factories'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const handlers = [
  // Categories endpoints
  http.get(`${BASE_URL}/api/categories`, () => {
    return HttpResponse.json(mockCategories)
  }),

  http.post(`${BASE_URL}/api/categories`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ id: 'new-cat', ...body }, { status: 201 })
  }),

  http.put(`${BASE_URL}/api/categories/:id`, async ({ params, request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ id: params.id, ...body })
  }),

  http.delete(`${BASE_URL}/api/categories/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE_URL}/api/categories/reorder`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),

  // Menu endpoints
  http.get(`${BASE_URL}/api/menu`, () => {
    return HttpResponse.json(mockMenuItems)
  }),

  http.post(`${BASE_URL}/api/menu`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ id: 'new-item', ...body }, { status: 201 })
  }),

  http.put(`${BASE_URL}/api/menu/:id`, async ({ params, request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ id: params.id, ...body })
  }),

  http.delete(`${BASE_URL}/api/menu/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Orders endpoints
  http.get(`${BASE_URL}/api/orders`, () => {
    const orders = [
      createMockOrder({ id: '1', status: 'pending' }),
      createMockOrder({ id: '2', status: 'confirmed' }),
    ]
    return HttpResponse.json(orders)
  }),

  http.post(`${BASE_URL}/api/orders`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json(
      { id: 'new-order', ...body, status: 'pending', createdAt: Date.now() },
      { status: 201 }
    )
  }),

  http.get(`${BASE_URL}/api/orders/:id`, ({ params }) => {
    return HttpResponse.json(createMockOrder({ id: params.id as string }))
  }),

  http.put(`${BASE_URL}/api/orders/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ id: params.id, ...body })
  }),

  // Settings endpoint
  http.get(`${BASE_URL}/api/settings`, () => {
    return HttpResponse.json({
      name: 'Test Restaurant',
      phone: '555-0100',
      email: 'test@restaurant.com',
      address: '123 Test St',
      deliveryFee: 5,
      minimumOrder: 15,
      taxRate: 0.08,
    })
  }),

  http.put(`${BASE_URL}/api/settings`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),

  // Auth endpoints
  http.post(`${BASE_URL}/api/auth/signin`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      user: { id: '1', email: body.email, role: 'admin' },
      token: 'mock-token',
    })
  }),
]

export const errorHandlers = [
  http.get(`${BASE_URL}/api/menu`, () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
  }),

  http.post(`${BASE_URL}/api/orders`, () => {
    return HttpResponse.json({ error: 'Validation failed' }, { status: 400 })
  }),
]
