import { ISSUE_CATEGORIES } from '@pilote/kpilote-shared/assistant/feedback'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { z } from 'zod'

import type { ConversationsFilters } from '@/api/assistant'
import { AssistantAccesPanel } from '@/components/assistant/AssistantAccesPanel'
import { AssistantConversationsPanel } from '@/components/assistant/AssistantConversationsPanel'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Tabs, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { assistantAccesQueryOptions } from '@/queries/assistant'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

const TABS = ['acces', 'conversations'] as const

// Une adresse modifiée à la main retombe sur les valeurs par défaut plutôt que d'échouer.
const searchSchema = z.object({
  onglet: z.enum(TABS).default('acces').catch('acces'),
  page: z.number().int().min(1).default(1).catch(1),
  recherche: z.coerce.string().optional().catch(undefined),
  positif: z.boolean().optional().catch(undefined),
  negatif: z.boolean().optional().catch(undefined),
  commentaire: z.boolean().optional().catch(undefined),
  categorie: z.enum(ISSUE_CATEGORIES).optional().catch(undefined),
})

const isTab = (value: string): value is (typeof TABS)[number] =>
  (TABS as readonly string[]).includes(value)

export const Route = createFileRoute('/_authed/assistant/')({
  validateSearch: searchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.fetchQuery(assistantAccesQueryOptions()),
      context.queryClient.fetchQuery(utilisateursAllQueryOptions()),
    ]),
  component: AssistantComponent,
})

function AssistantComponent() {
  const { onglet, ...filters } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const onFiltersChange = useCallback(
    (next: ConversationsFilters) => void navigate({ search: { onglet, ...next }, replace: true }),
    [navigate, onglet],
  )

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Assistant IA</span>
      </Breadcrumb>
      <PageHeading
        title="Assistant IA"
        subtitle="Qui peut s’en servir, et ce que les utilisateurs en font."
      />

      <Tabs
        value={onglet}
        onValueChange={(value) => {
          if (isTab(value)) void navigate({ search: { onglet: value }, replace: true })
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="acces">Accès</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>
      </Tabs>

      {onglet === 'acces' ? <AssistantAccesPanel /> : null}
      {onglet === 'conversations' ? (
        <AssistantConversationsPanel filters={filters} onFiltersChange={onFiltersChange} />
      ) : null}
    </div>
  )
}
