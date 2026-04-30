import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

const fetchMock = vi.fn()

const setDefaultFetchResponse = () => {
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
}

beforeAll(() => {
  vi.stubGlobal('fetch', fetchMock)
  setDefaultFetchResponse()
})

afterEach(() => {
  fetchMock.mockReset()
  setDefaultFetchResponse()
})

afterAll(() => {
  vi.unstubAllGlobals()
})
