import { ISSUE_CATEGORIES } from '@pilote/kpilote-shared/assistant/feedback'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { z } from 'zod'

import type { ConversationsFiltres } from '@/api/assistant'
import { AssistantAccesPanel } from '@/components/assistant/AssistantAccesPanel'
import { AssistantConversationsPanel } from '@/components/assistant/AssistantConversationsPanel'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Tabs, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { assistantAccesQueryOptions } from '@/queries/assistant'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

const ONGLETS = ['acces', 'conversations'] as const

const searchSchema = z.object({
  onglet: z.enum(ONGLETS).default('acces'),
  page: z.number().int().min(1).default(1),
  recherche: z.string().optional(),
  positif: z.boolean().optional(),
  negatif: z.boolean().optional(),
  commentaire: z.boolean().optional(),
  categorie: z.enum(ISSUE_CATEGORIES).optional(),
})

const isOnglet = (value: string): value is (typeof ONGLETS)[number] =>
  (ONGLETS as readonly string[]).includes(value)

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
  const { onglet, ...filtres } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const onFiltresChange = useCallback(
    (next: ConversationsFiltres) => void navigate({ search: { onglet, ...next }, replace: true }),
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
          if (isOnglet(value)) void navigate({ search: { onglet: value }, replace: true })
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="acces">Accès</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>
      </Tabs>

      {onglet === 'acces' ? <AssistantAccesPanel /> : null}
      {onglet === 'conversations' ? (
        <AssistantConversationsPanel filtres={filtres} onFiltresChange={onFiltresChange} />
      ) : null}
    </div>
  )
}
