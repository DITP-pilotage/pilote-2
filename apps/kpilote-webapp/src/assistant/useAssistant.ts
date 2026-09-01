import { Chat, useChat } from '@ai-sdk/react'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

export const useAssistant = (conversationId: string) => {
  // `useState` avec initialiseur paresseux plutôt qu'un ref : la valeur est lue pendant le
  // rendu, ce que React interdit sur un ref. Le `Chat` reste construit une seule fois.
  const [chat] = useState(
    () =>
      new Chat<KpiloteUIMessage>({
        id: conversationId,
        transport: new DefaultChatTransport<KpiloteUIMessage>({
          api: `${env.apiUrl}/assistant/chat`,
          body: { surface: 'ask-libre', conversationId },
          // Le jeton est lu à chaque envoi, pas capturé à la construction : il tourne.
          headers: () => {
            const jeton = tokenStore.get()
            return jeton ? { Authorization: `Bearer ${jeton}` } : {}
          },
        }),
      }),
  )

  // Le throttle évite un re-rendu par token : le flux arrive plus vite que React ne peint.
  return useChat<KpiloteUIMessage>({ chat, experimental_throttle: 250 })
}
