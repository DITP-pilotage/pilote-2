import { describe, expect, it } from 'vitest'

import { awaitLater, yieldToEventLoop } from '@/framework/concurrency'

describe.concurrent('awaitLater', () => {
  it('lève l’erreur au moment où la promesse est attendue, même rejetée bien avant', async () => {
    const pending = awaitLater(Promise.reject(new Error('Échec du rapprochement')))
    // Sans `awaitLater`, Vitest signalerait ici un rejet non géré.
    await yieldToEventLoop()

    await expect(pending).rejects.toThrow('Échec du rapprochement')
  })

  it('rend la valeur d’une promesse tenue', async () => {
    await expect(awaitLater(Promise.resolve(42))).resolves.toBe(42)
  })
})
