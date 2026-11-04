import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { useQuery } from '@tanstack/react-query'
import { validateUIMessages } from 'ai'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'

import { assistantAccessQueryOptions, fetchConversation } from '../assistantApi'
import { loadChat, stopChat } from '../useAssistant'
import { clearMinimized, readMinimized, writeMinimized } from './minimizedStorage'
import { readViewPreference, writeViewPreference } from './preferencesStorage'
import { useScreenSize } from './useScreenSize'
import { effectiveView, viewsFor, type AssistantDisplay, type AssistantView } from './views'

type AssistantContextValue = {
  allowed: boolean
  /** `null` tant qu'aucune conversation n'a été ouverte. */
  conversationId: string | null
  display: AssistantDisplay
  availableViews: readonly AssistantView[]
  /** Question venue de la palette, envoyée une fois par le fil. */
  pendingQuestion: string
  clearPendingQuestion: () => void
  open: (question?: string) => void
  minimize: () => void
  restore: () => void
  changeView: (view: AssistantView) => void
  toWindow: () => void
  newConversation: () => void
  selectConversation: (id: string) => Promise<void>
  /** La palette s'enregistre pour que Maj+Tab y ramène depuis le plein écran. */
  registerPalette: (openPalette: (() => void) | null) => void
  backToPalette: (() => void) | null
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export const useAssistantDisplay = (): AssistantContextValue => {
  const value = useContext(AssistantContext)
  if (!value) throw new Error('useAssistantDisplay doit être utilisé sous AssistantProvider')
  return value
}

const savedMessages = async (id: string): Promise<KpiloteUIMessage[] | null> => {
  const conversation = await fetchConversation(id)
  if (!conversation) return null
  return validateUIMessages<KpiloteUIMessage>({ messages: conversation.messages })
}

/**
 * L'état de l'assistant pour toute l'application, comme sur PPG : la vue choisie, la
 * conversation en cours et son masquage. La palette ⌘K reste la porte d'entrée ; la pastille
 * ne fait qu'ouvrir ou reprendre.
 */
export function AssistantProvider({ enabled, children }: PropsWithChildren<{ enabled: boolean }>) {
  const { data: access } = useQuery({ ...assistantAccessQueryOptions(), enabled })
  const allowed = enabled && access?.allowed === true
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [requested, setRequested] = useState<AssistantDisplay>('fullscreen')
  const [viewBeforeMinimize, setViewBeforeMinimize] = useState<AssistantView | null>(null)
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [palette, setPalette] = useState<{ open: () => void } | null>(null)
  const clearPendingQuestion = useCallback(() => setPendingQuestion(''), [])
  const screenSize = useScreenSize()
  const display = conversationId ? effectiveView(requested, screenSize) : 'minimized'

  // Au chargement de l'onglet, la conversation masquée revient en pastille ; introuvable,
  // elle est oubliée.
  const restoredFromStorage = useRef(false)
  useEffect(() => {
    if (!allowed || restoredFromStorage.current) return
    restoredFromStorage.current = true
    const stored = readMinimized()
    if (!stored) return
    savedMessages(stored.id)
      .then((messages) => {
        if (!messages) {
          clearMinimized()
          return
        }
        loadChat(stored.id, messages)
        setConversationId(stored.id)
        setRequested('minimized')
      })
      .catch(() => clearMinimized())
  }, [allowed])

  const open = useCallback(
    (question?: string) => {
      if (!conversationId) setConversationId(crypto.randomUUID())
      if (question) setPendingQuestion(question)
      setRequested(readViewPreference() ?? 'fullscreen')
    },
    [conversationId],
  )

  const minimize = useCallback(() => {
    if (conversationId) writeMinimized(conversationId)
    if (requested !== 'minimized') setViewBeforeMinimize(requested)
    setRequested('minimized')
  }, [conversationId, requested])

  const restore = useCallback(() => {
    setRequested(viewBeforeMinimize ?? readViewPreference() ?? 'fullscreen')
  }, [viewBeforeMinimize])

  const changeView = useCallback((view: AssistantView) => {
    writeViewPreference(view)
    setRequested(view)
  }, [])

  // Passage de circonstance, pour laisser voir la page : la vue préférée ne change pas.
  const toWindow = useCallback(() => {
    setRequested(viewsFor(screenSize).includes('floating') ? 'floating' : 'minimized')
  }, [screenSize])

  const newConversation = useCallback(() => {
    if (conversationId) stopChat(conversationId)
    clearMinimized()
    setConversationId(crypto.randomUUID())
  }, [conversationId])

  const selectConversation = useCallback(
    async (id: string) => {
      if (conversationId) stopChat(conversationId)
      clearMinimized()
      const messages = await savedMessages(id)
      if (!messages) return
      loadChat(id, messages)
      setConversationId(id)
    },
    [conversationId],
  )

  const registerPalette = useCallback((openPalette: (() => void) | null) => {
    setPalette(openPalette ? { open: openPalette } : null)
  }, [])

  const backToPalette = useMemo(
    () =>
      palette
        ? () => {
            minimize()
            palette.open()
          }
        : null,
    [minimize, palette],
  )

  const value = useMemo(
    () => ({
      allowed,
      conversationId,
      display,
      availableViews: viewsFor(screenSize),
      pendingQuestion,
      clearPendingQuestion,
      open,
      minimize,
      restore,
      changeView,
      toWindow,
      newConversation,
      selectConversation,
      registerPalette,
      backToPalette,
    }),
    [
      allowed,
      conversationId,
      display,
      screenSize,
      pendingQuestion,
      clearPendingQuestion,
      open,
      minimize,
      restore,
      changeView,
      toWindow,
      newConversation,
      selectConversation,
      registerPalette,
      backToPalette,
    ],
  )

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}
