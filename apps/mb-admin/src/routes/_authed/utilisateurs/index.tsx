import type { UtilisateurApiModel } from '@pilote/mb-shared/utilisateur'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { utilisateursQueryOptions } from '@/queries/utilisateurs'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/utilisateurs/')({
  component: UtilisateursListComponent,
})

const STATUS_LABEL: Record<UtilisateurApiModel['status'], string> = {
  en_attente: 'En attente',
  actif: 'Actif',
}

const STATUS_CLASS: Record<UtilisateurApiModel['status'], string> = {
  en_attente: 'text-text-muted',
  actif: 'font-semibold text-primary',
}

const PROVIDER_LABEL: Record<UtilisateurApiModel['providers'][number], string> = {
  proconnect: 'ProConnect',
  keycloak: 'Keycloak',
}

function UtilisateursListComponent() {
  const isProd = session.current?.environment === 'prod'
  const query = useQuery(utilisateursQueryOptions())
  const items = query.data ?? []

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Utilisateurs</span>
      </Breadcrumb>
      <PageHeading
        title="Utilisateurs"
        subtitle={
          <>
            {items.length} utilisateur{items.length > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-accent' : undefined}>{session.current?.environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/utilisateurs/nouveau">
              <Plus className="size-4" /> Créer un utilisateur
            </Link>
          </Button>
        }
      />

      {query.isError ? (
        <p className="mb-4 text-sm font-medium text-accent">
          Impossible de charger les utilisateurs. Une clé de session de rôle ADMIN est requise.
        </p>
      ) : null}

      {items.length === 0 && !query.isLoading && !query.isError ? (
        <EmptyState
          title="Aucun utilisateur"
          description="Créez votre premier utilisateur pré-provisionné."
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Prénom / Nom</Table.HeaderCell>
              <Table.HeaderCell>Service</Table.HeaderCell>
              <Table.HeaderCell>Fonction</Table.HeaderCell>
              <Table.HeaderCell>Statut</Table.HeaderCell>
              <Table.HeaderCell>Providers</Table.HeaderCell>
              <Table.HeaderCell>Créé le</Table.HeaderCell>
              <Table.HeaderCell align="right" />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((u) => (
              <Table.Row key={u.id}>
                <Table.Cell>
                  <span className="font-mono text-sm">{u.email}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-semibold">
                    {u.prenom} {u.nom}
                  </span>
                </Table.Cell>
                <Table.Cell>{u.service}</Table.Cell>
                <Table.Cell>{u.fonction}</Table.Cell>
                <Table.Cell>
                  <span className={STATUS_CLASS[u.status]}>{STATUS_LABEL[u.status]}</span>
                </Table.Cell>
                <Table.Cell>
                  {u.providers.length === 0 ? (
                    <span className="text-text-subtle">—</span>
                  ) : (
                    <span className="inline-flex gap-1">
                      {u.providers.map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-border px-2 py-0.5 text-xs"
                        >
                          {PROVIDER_LABEL[p]}
                        </span>
                      ))}
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <span className="text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </Table.Cell>
                <Table.Cell align="right">
                  <Button variant="tertiary" size="sm" type="button" asChild>
                    <Link to="/utilisateurs/$id" params={{ id: u.id }}>
                      Modifier
                    </Link>
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
