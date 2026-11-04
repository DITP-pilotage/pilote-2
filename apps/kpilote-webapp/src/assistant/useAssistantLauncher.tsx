import { Button } from '@pilote/kpilote-ui/Button'
import { Modale } from '@pilote/kpilote-ui/Modale'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { assistantAccessQueryOptions } from './assistantApi'
import { AssistantPanel } from './AssistantPanel'
import { ResponseActions } from './ResponseActions'
import { usePageContext } from './usePageContext'

/**
 * L'assistant ouvert depuis la palette. La conversation est gardée d'une ouverture à
 * l'autre ; seul « Nouvelle conversation » en démarre une autre.
 */
export const useAssistantLauncher = ({
  enabled,
  onBackToPalette,
}: {
  enabled: boolean
  onBackToPalette: () => void
}) => {
  const { data: access } = useQuery({ ...assistantAccessQueryOptions(), enabled })
  const pageContext = usePageContext()
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID())
  const [open, setOpen] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState('')
  const clearPendingQuestion = useCallback(() => setPendingQuestion(''), [])

  const launch = (question: string) => {
    setPendingQuestion(question)
    setOpen(true)
  }

  const backToPalette = () => {
    setOpen(false)
    onBackToPalette()
  }

  const modal = open ? (
    <Modale
      open
      onClose={() => setOpen(false)}
      onEscape={backToPalette}
      titre="Assistant kpilote"
      description="Les réponses proviennent de vos données kpilote. Vérifiez-les avant de les diffuser."
      size="lg"
      footer={
        <Button variant="tertiary" size="sm" onClick={() => setConversationId(crypto.randomUUID())}>
          Nouvelle conversation
        </Button>
      }
    >
      <AssistantPanel
        key={conversationId}
        conversationId={conversationId}
        pageContext={pageContext}
        initialQuestion={pendingQuestion}
        onInitialQuestionSent={clearPendingQuestion}
        onBack={backToPalette}
        renderActions={(message) => <ResponseActions message={message} />}
      />
    </Modale>
  ) : null

  return { allowed: access?.allowed === true, launch, modal }
}
