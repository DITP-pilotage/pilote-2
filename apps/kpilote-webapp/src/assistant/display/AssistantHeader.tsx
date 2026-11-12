import { deriveTitle } from '@pilote/kpilote-shared/assistant/conversation'
import { ChevronsRight, Minus, SquarePen } from 'lucide-react'

import { HistoryMenu } from '../history/HistoryMenu'
import { useConversationState } from '../useAssistant'
import { useAssistantDisplay } from './AssistantProvider'
import { ViewMenu } from './ViewMenu'

const ICON_BUTTON =
  'flex size-8 shrink-0 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary-tinted'

export function AssistantHeader({ conversationId }: { conversationId: string }) {
  const { display, minimize, newConversation } = useAssistantDisplay()
  const { messages } = useConversationState(conversationId)

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border pr-2 pl-3">
      <HistoryMenu conversationId={conversationId} titre={deriveTitle(messages)} />
      <span className="min-w-2 flex-1" />
      <button
        type="button"
        aria-label="Nouvelle conversation"
        title="Nouvelle conversation"
        className={ICON_BUTTON}
        onClick={newConversation}
      >
        <SquarePen className="size-[18px]" />
      </button>
      <ViewMenu />
      <button
        type="button"
        aria-label="Masquer l'assistant"
        title="Masquer"
        className={ICON_BUTTON}
        onClick={minimize}
      >
        {display === 'sidePanel' ? (
          <ChevronsRight className="size-[18px]" />
        ) : (
          <Minus className="size-[18px]" />
        )}
      </button>
    </div>
  )
}
