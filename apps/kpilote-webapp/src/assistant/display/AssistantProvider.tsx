import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
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

import { analytics } from '@/analytics/tracker'

import { assistantAccessQueryOptions, fetchConversation } from '../assistantApi'
import type { PendingQuestion } from '../pendingQuestion'
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
  pendingQuestion: PendingQuestion | null
  clearPendingQuestion: (id: string) => void
  open: (question?: string) => void
  minimize: () => void
  restore: () => void
  changeView: (view: AssistantView) => void
  toWindow: () => void
  newConversation: () => void
  selectConversation: (id: string) => Promise<void>
  /** La palette s'enregistre pour que Maj+Tab y ramène depuis une vue modale. */
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
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null)
  const [palette, setPalette] = useState<{ open: () => void } | null>(null)
  const clearPendingQuestion = useCallback(
    (id: string) => setPendingQuestion((current) => (current?.id === id ? null : current)),
    [],
  )
  const screenSize = useScreenSize()
  // Pour les callbacks asynchrones : la conversation ouverte au moment où ils aboutissent.
  const currentId = useRef<string | null>(null)
  useEffect(() => {
    currentId.current = conversationId
  }, [conversationId])
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
        // Ouvert entre-temps depuis la palette : la conversation ouverte l'emporte.
        if (currentId.current) return
        loadChat(stored.id, messages)
        setConversationId(stored.id)
        setRequested('minimized')
      })
      .catch(() => clearMinimized())
  }, [allowed])

  // La vue réellement affichée, une fois repliée selon la largeur de l'écran.
  const shownView = useCallback(
    (view: AssistantView): AssistantView => {
      const shown = effectiveView(view, screenSize)
      return shown === 'minimized' ? view : shown
    },
    [screenSize],
  )

  // La palette passe toujours une question ; la pastille, jamais.
  const open = useCallback(
    (question?: string) => {
      if (!conversationId) setConversationId(crypto.randomUUID())
      const text = question?.trim()
      if (text) setPendingQuestion({ id: crypto.randomUUID(), text })
      const view = readViewPreference() ?? 'fullscreen'
      setRequested(view)
      // Une question posée par la palette pendant que l'assistant est visible n'ouvre rien.
      if (display !== 'minimized') return
      analytics.trackEvent(
        analyticsEvents.assistant.open({
          source: question === undefined ? 'pastille' : 'palette',
          view: shownView(view),
        }),
      )
    },
    [conversationId, display, shownView],
  )

  const minimize = useCallback(() => {
    if (conversationId) writeMinimized(conversationId)
    if (requested !== 'minimized') setViewBeforeMinimize(requested)
    setRequested('minimized')
  }, [conversationId, requested])

  const restore = useCallback(() => {
    const view = viewBeforeMinimize ?? readViewPreference() ?? 'fullscreen'
    setRequested(view)
    analytics.trackEvent(analyticsEvents.assistant.resume({ view: shownView(view) }))
  }, [shownView, viewBeforeMinimize])

  const changeView = useCallback(
    (view: AssistantView) => {
      writeViewPreference(view)
      setRequested(view)
      if (display !== 'minimized' && display !== view) {
        analytics.trackEvent(analyticsEvents.assistant.viewChange({ from: display, to: view }))
      }
    },
    [display],
  )

  // Passage de circonstance, pour laisser voir la page : la vue préférée ne change pas.
  const toWindow = useCallback(() => {
    if (viewsFor(screenSize).includes('floating')) setRequested('floating')
    else minimize()
  }, [minimize, screenSize])

  // Seule la dernière sélection s'applique, même si une autre action est venue entre-temps.
  const selection = useRef(0)

  const newConversation = useCallback(() => {
    selection.current += 1
    if (conversationId) stopChat(conversationId)
    clearMinimized()
    setConversationId(crypto.randomUUID())
  }, [conversationId])

  const selectConversation = useCallback(
    async (id: string) => {
      const ticket = ++selection.current
      if (conversationId) stopChat(conversationId)
      clearMinimized()
      const messages = await savedMessages(id)
      if (ticket !== selection.current) return
      if (!messages) throw new Error('Conversation introuvable')
      loadChat(id, messages)
      setConversationId(id)
      analytics.trackEvent(analyticsEvents.assistant.historySelect())
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
