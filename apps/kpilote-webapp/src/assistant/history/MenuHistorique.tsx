import { clsxm } from '@pilote/kpilote-ui/clsxm'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Search, Trash2 } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useMemo, useState } from 'react'

import { conversationsQueryOptions, deleteConversation } from '../assistantApi'
import { useAssistantDisplay } from '../display/AssistantProvider'
import { formatConversationDate, groupByPeriod, matchesSearch } from './historyGroups'

/** Le titre de la conversation ouvre l'historique : reprise, recherche, suppression. */
export function MenuHistorique({
  conversationId,
  titre,
}: {
  conversationId: string
  titre: string
}) {
  const { selectConversation, newConversation } = useAssistantDisplay()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  // Figé à l'ouverture : les périodes et les heures se lisent par rapport à ce moment.
  const [now, setNow] = useState(() => new Date())
  const { data: conversations = [] } = useQuery({ ...conversationsQueryOptions(), enabled: open })

  const remove = useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: conversationsQueryOptions().queryKey })
      if (id === conversationId) newConversation()
    },
    onError: () => toast({ title: "La conversation n'a pas pu être supprimée", variant: 'error' }),
  })

  const groups = useMemo(
    () =>
      groupByPeriod(
        conversations.filter((conversation) => matchesSearch(conversation.titre, search)),
        now,
      ),
    [conversations, now, search],
  )

  const select = (id: string) => {
    setOpen(false)
    if (id === conversationId) return
    selectConversation(id).catch(() =>
      toast({ title: "La conversation n'a pas pu être ouverte", variant: 'error' }),
    )
  }

  const askRemove = (id: string) => {
    // eslint-disable-next-line no-alert -- confirmation simple, comme sur PPG
    if (window.confirm('Supprimer cette conversation ?')) remove.mutate(id)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) setNow(new Date())
        else setSearch('')
      }}
    >
      <Popover.Trigger
        title="Historique des conversations"
        className="flex h-8 min-w-0 items-center gap-1.5 rounded-md px-2 text-left transition-colors hover:bg-primary-tinted data-[state=open]:bg-primary-tinted"
      >
        <span className="min-w-0 truncate text-sm leading-5 font-semibold text-text">{titre}</span>
        <ChevronDown className="size-4 shrink-0 text-text-subtle" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          aria-label="Historique des conversations"
          className="z-50 flex max-h-[min(480px,70vh)] w-[340px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <label className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="size-4 shrink-0 text-text-subtle" />
            <span className="sr-only">Rechercher une conversation</span>
            <input
              type="search"
              value={search}
              placeholder="Rechercher une conversation"
              className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
            {groups.length === 0 ? (
              <p className="m-0 px-2.5 py-3 text-xs text-text-subtle">
                {search ? 'Aucune conversation trouvée.' : 'Aucune conversation.'}
              </p>
            ) : null}
            {groups.map((group) => (
              <div key={group.label}>
                <p className="m-0 px-2.5 pt-3 pb-1.5 text-xs leading-4 font-bold text-text-subtle">
                  {group.label}
                </p>
                {group.items.map((conversation) => {
                  const active = conversation.id === conversationId
                  return (
                    <div
                      key={conversation.id}
                      className={clsxm(
                        'group flex h-9 items-center gap-1 rounded-md pr-1 pl-2.5',
                        active
                          ? 'bg-primary-tinted text-primary'
                          : 'text-text hover:bg-surface-tinted',
                      )}
                    >
                      <button
                        type="button"
                        title={conversation.titre}
                        aria-current={active ? 'true' : undefined}
                        className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
                        onClick={() => select(conversation.id)}
                      >
                        <span
                          className={clsxm(
                            'min-w-0 flex-1 truncate text-sm',
                            active && 'font-medium',
                          )}
                        >
                          {conversation.titre}
                        </span>
                        <span className="shrink-0 pr-1.5 text-xs text-text-subtle group-focus-within:hidden group-hover:hidden">
                          {formatConversationDate(conversation.updatedAt, now)}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Supprimer la conversation"
                        title="Supprimer"
                        className="hidden size-7 shrink-0 items-center justify-center rounded-md text-text-subtle group-focus-within:flex group-hover:flex hover:bg-surface-tinted hover:text-error"
                        onClick={() => askRemove(conversation.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </nav>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
