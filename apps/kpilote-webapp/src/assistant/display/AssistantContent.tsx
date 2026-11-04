import type { MouseEvent } from 'react'

import { AssistantPanel } from '../AssistantPanel'
import { ResponseActions } from '../ResponseActions'
import { usePageContext } from '../usePageContext'
import { AssistantHeader } from './AssistantHeader'
import { useAssistantDisplay } from './AssistantProvider'

const isInternalLink = (target: EventTarget): boolean => {
  const link = target instanceof Element ? target.closest('a[href]') : null
  const href = link?.getAttribute('href') ?? ''
  return href.startsWith('/') && !href.startsWith('//')
}

/** En-tête et fil, communs aux trois vues. */
export function AssistantContent({ conversationId }: { conversationId: string }) {
  const { display, pendingQuestion, clearPendingQuestion, toWindow, backToPalette } =
    useAssistantDisplay()
  const pageContext = usePageContext()

  // En plein écran, un lien interne laisse voir la page : l'assistant passe en fenêtre
  // (ou se masque) avant que le lien ne navigue.
  const onLinkClick = (event: MouseEvent<HTMLDivElement>) => {
    if (display === 'fullscreen' && isInternalLink(event.target)) toWindow()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" onClickCapture={onLinkClick}>
      <AssistantHeader conversationId={conversationId} />
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <AssistantPanel
          key={conversationId}
          conversationId={conversationId}
          pageContext={pageContext}
          initialQuestion={pendingQuestion}
          onInitialQuestionSent={clearPendingQuestion}
          {...(display === 'fullscreen' && backToPalette ? { onBack: backToPalette } : {})}
          renderActions={(message) => <ResponseActions message={message} />}
        />
      </div>
    </div>
  )
}
