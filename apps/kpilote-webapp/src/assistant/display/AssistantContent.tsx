import type { MouseEvent } from 'react'

import { AssistantPanel } from '../AssistantPanel'
import { ResponseActions } from '../ResponseActions'
import { usePageContext } from '../usePageContext'
import { AssistantHeader } from './AssistantHeader'
import { useAssistantDisplay } from './AssistantProvider'
import { hidesPage } from './views'

const isInternalLink = (target: EventTarget): boolean => {
  const link = target instanceof Element ? target.closest('a[href]') : null
  const href = link?.getAttribute('href') ?? ''
  return href.startsWith('/') && !href.startsWith('//') && link?.getAttribute('target') !== '_blank'
}

/** En-tête et fil, communs aux trois vues. */
export function AssistantContent({ conversationId }: { conversationId: string }) {
  const { display, pendingQuestion, clearPendingQuestion, toWindow, backToPalette } =
    useAssistantDisplay()
  const pageContext = usePageContext()

  // En vue modale, un lien interne laisse voir la page : l'assistant passe en fenêtre
  // (ou se masque) avant que le lien ne navigue.
  // Un clic modifié (nouvel onglet) ou déjà traité ne quitte pas la page.
  const onLinkClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!hidesPage(display) || event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    if (isInternalLink(event.target)) toWindow()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" onClickCapture={onLinkClick}>
      <AssistantHeader conversationId={conversationId} />
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <AssistantPanel
          key={conversationId}
          conversationId={conversationId}
          pageContext={pageContext}
          pendingQuestion={pendingQuestion}
          onPendingQuestionSent={clearPendingQuestion}
          {...(hidesPage(display) && backToPalette ? { onBack: backToPalette } : {})}
          renderActions={(message) => <ResponseActions message={message} />}
        />
      </div>
    </div>
  )
}
