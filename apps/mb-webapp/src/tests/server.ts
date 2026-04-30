import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { env } from '@/env'
import {
  buildIndicateur,
  buildIndicateursList,
  buildMe,
} from '@/tests/factories/api'
import { buildLogoutResponse, buildRefreshResponse } from '@/tests/factories/bff'

const apiOrigin = new URL(env.apiUrl).origin

export const apiUrl = (path: string): string => new URL(path, apiOrigin).toString()
// MSW matches BFF requests by path : ky construit l'URL via location.origin
// (jsdom = http://localhost) mais le handler reste portable.
export const bffUrl = (path: string): string => path

export const defaultHandlers = [
  http.post(bffUrl('/auth/refresh'), () => HttpResponse.json(buildRefreshResponse())),
  http.post(bffUrl('/auth/logout'), () => HttpResponse.json(buildLogoutResponse())),
  http.get(apiUrl('/me'), () => HttpResponse.json(buildMe())),
  http.get(apiUrl('/indicateurs'), () => HttpResponse.json(buildIndicateursList())),
  http.get(apiUrl('/indicateurs/:id'), () => HttpResponse.json(buildIndicateur())),
]

export const server = setupServer(...defaultHandlers)
