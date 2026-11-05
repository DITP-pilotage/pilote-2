import {
  ISSUE_CATEGORIES,
  CATEGORY_LABELS,
  type IssueCategory,
} from '@pilote/kpilote-shared/assistant/feedback'
import { formatDate } from '@pilote/kpilote-shared/formatDate'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { ConversationsFiltres } from '@/api/assistant'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { MultiToggle } from '@pilote/kpilote-ui/MultiToggle'
import { Pagination } from '@pilote/kpilote-ui/Pagination'
import { SearchField } from '@pilote/kpilote-ui/SearchField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pilote/kpilote-ui/Select'
import { Table } from '@pilote/kpilote-ui/Table'
import { clickableRowProps } from '@/lib/clickableRow'
import { assistantConversationsQueryOptions } from '@/queries/assistant'

const RETOURS = ['positif', 'negatif', 'commentaire'] as const
type Retour = (typeof RETOURS)[number]

const RETOUR_OPTIONS = [
  { value: 'positif', label: '👍 Positif' },
  { value: 'negatif', label: '👎 Négatif' },
  { value: 'commentaire', label: '💬 Commentaire' },
] as const

const TOUTES = 'TOUTES'

const isCategory = (value: string): value is IssueCategory =>
  (ISSUE_CATEGORIES as readonly string[]).includes(value)

const SEARCH_DEBOUNCE_MS = 300

export function AssistantConversationsPanel({
  filtres,
  onFiltresChange,
}: {
  filtres: ConversationsFiltres
  onFiltresChange: (filtres: ConversationsFiltres) => void
}) {
  const navigate = useNavigate()
  const query = useQuery(assistantConversationsQueryOptions(filtres))
  const [recherche, setRecherche] = useState(filtres.recherche ?? '')
  const retours = RETOURS.filter((retour) => filtres[retour] === true)

  // La recherche part après une pause de frappe, et ramène à la première page.
  useEffect(() => {
    if (recherche === (filtres.recherche ?? '')) return
    const timer = setTimeout(
      () => onFiltresChange({ ...filtres, page: 1, recherche: recherche || undefined }),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [recherche, filtres, onFiltresChange])

  const data = query.data
  const debut = data ? (data.page - 1) * data.taillePage + 1 : 0
  const fin = data ? debut + data.items.length - 1 : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-72 flex-1">
          <SearchField
            label="Rechercher dans le titre"
            placeholder="Rechercher dans le titre…"
            value={recherche}
            onChange={setRecherche}
          />
        </div>
        <MultiToggle<Retour>
          ariaLabel="Retours"
          value={retours}
          onValueChange={(value) =>
            onFiltresChange({
              ...filtres,
              page: 1,
              positif: value.includes('positif') || undefined,
              negatif: value.includes('negatif') || undefined,
              commentaire: value.includes('commentaire') || undefined,
            })
          }
          options={RETOUR_OPTIONS}
        />
        <Select
          value={filtres.categorie ?? TOUTES}
          onValueChange={(value) =>
            onFiltresChange({
              ...filtres,
              page: 1,
              categorie: isCategory(value) ? value : undefined,
            })
          }
        >
          <SelectTrigger aria-label="Catégorie de problème" className="min-w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUTES}>Toutes les catégories</SelectItem>
            {ISSUE_CATEGORIES.map((categorie) => (
              <SelectItem key={categorie} value={categorie}>
                {CATEGORY_LABELS[categorie].title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isError ? (
        <EmptyState
          title="Chargement impossible"
          description="Les conversations n’ont pas pu être chargées."
        />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title="Aucune conversation"
          description="Aucune conversation ne correspond à ces filtres."
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Conversation</Table.HeaderCell>
              <Table.HeaderCell>Créée le</Table.HeaderCell>
              <Table.HeaderCell>Mise à jour</Table.HeaderCell>
              <Table.HeaderCell align="right">Tours</Table.HeaderCell>
              <Table.HeaderCell align="right">👍</Table.HeaderCell>
              <Table.HeaderCell align="right">👎</Table.HeaderCell>
              <Table.HeaderCell align="right">💬</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {(data?.items ?? []).map((conversation) => (
              <Table.Row
                key={conversation.id}
                {...clickableRowProps(
                  () =>
                    void navigate({
                      to: '/assistant/conversations/$id',
                      params: { id: conversation.id },
                    }),
                )}
              >
                <Table.Cell>
                  <span className="font-semibold">{conversation.titre}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-text-muted">{formatDate(conversation.createdAt)}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-text-muted">{formatDate(conversation.updatedAt)}</span>
                </Table.Cell>
                <Table.Cell align="right">{conversation.tours}</Table.Cell>
                <Table.Cell align="right">{conversation.positifs || '—'}</Table.Cell>
                <Table.Cell align="right">{conversation.negatifs || '—'}</Table.Cell>
                <Table.Cell align="right">{conversation.commentaires || '—'}</Table.Cell>
                <Table.Cell align="right">
                  <span className="text-primary">→</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {data && data.total > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-text-muted">
            {data.items.length > 0
              ? `${debut} – ${fin} sur ${data.total}`
              : `${data.total} au total`}
          </span>
          <Pagination
            hasPrevious={data.page > 1}
            hasNext={data.page * data.taillePage < data.total}
            onPrevious={() => onFiltresChange({ ...filtres, page: data.page - 1 })}
            onNext={() => onFiltresChange({ ...filtres, page: data.page + 1 })}
          />
        </div>
      ) : null}
    </div>
  )
}
