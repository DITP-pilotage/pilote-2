import type { MouseEvent } from 'react'

import { analytics } from '@/analytics/tracker'

import { AssistantPanel } from '../AssistantPanel'
import { ResponseActions } from '../ResponseActions'
import { linkEvent } from '../tracking'
import { usePageContext } from '../usePageContext'
import { AssistantHeader } from './AssistantHeader'
import { useAssistantDisplay } from './AssistantProvider'
import { ExperimentationBanner } from './ExperimentationBanner'
import { hidesPage } from './views'

const linkOf = (target: EventTarget): Element | null =>
  target instanceof Element ? target.closest('a[href]') : null

const isInternalLink = (link: Element): boolean => {
  const href = link.getAttribute('href') ?? ''
  return href.startsWith('/') && !href.startsWith('//') && link.getAttribute('target') !== '_blank'
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
    const link = linkOf(event.target)
    if (!link) return
    const tracked = linkEvent(link.getAttribute('href') ?? '')
    if (tracked) analytics.trackEvent(tracked)
    if (!hidesPage(display) || event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    if (isInternalLink(link)) toWindow()
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
          renderActions={(message) => (
            <ResponseActions message={message} conversationId={conversationId} />
          )}
        />
      </div>
      <ExperimentationBanner compact={!hidesPage(display)} />
    </div>
  )
}
