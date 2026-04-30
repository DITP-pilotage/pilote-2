import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

const fetchMock = vi.fn()

beforeAll(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})
