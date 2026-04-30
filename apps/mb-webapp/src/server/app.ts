import { Hono } from 'hono'

import { authRouter } from '@/server/auth/router'

export const app = new Hono()

app.get('/healthz', (context) => context.text('ok\n'))
app.route('/auth', authRouter)
