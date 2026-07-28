import { searchUnaccent } from '@pilote/kpilote-shared/texte'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { supprimerRelation, upsertRelationParent } from '@/api/relations'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { IndividuPicker } from '@/components/relations/IndividuPicker'
import { useAppConfig } from '@/context/AppConfigContext'
import { extractApiError } from '@/lib/apiError'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { individusAllQueryOptions } from '@/queries/individus'
import { relationsAllQueryOptions } from '@/queries/relations'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { SearchField } from '@pilote/kpilote-ui/SearchField'
import { Table } from '@pilote/kpilote-ui/Table'
import { useToast } from '@pilote/kpilote-ui/Toast'

export const Route = createFileRoute('/_authed/relations/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.fetchQuery(individusAllQueryOptions()),
      context.queryClient.fetchQuery(relationsAllQueryOptions()),
    ])
  },
  component: RelationsComponent,
})

type LigneEnAttente = { id: string; nom: string; referentiel: string }

function RelationsComponent() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, environment } = useAppConfig()
  const { locked, unlock } = useProdEditUnlock()
  const [recherche, setRecherche] = useState('')
  const [enAttente, setEnAttente] = useState<LigneEnAttente[]>([])

  const { data: toutesRelations } = useSuspenseQuery(relationsAllQueryOptions())
  const { data: individus } = useSuspenseQuery(individusAllQueryOptions())

  const terme = searchUnaccent(recherche)
  const relations = terme
    ? toutesRelations.filter((relation) => searchUnaccent(relation.enfant.nom).includes(terme))
    : toutesRelations
  const total = toutesRelations.length

  const invalider = async () => {
    await queryClient.invalidateQueries({ queryKey: ['relations'] })
    await queryClient.invalidateQueries({ queryKey: ['individus'] })
  }

  const upsert = useMutation({
    mutationFn: ({ enfant, parent }: { enfant: string; parent: string }) =>
      upsertRelationParent(enfant, { parent }),
    onSuccess: async (_data, variables) => {
      setEnAttente((lignes) => lignes.filter((ligne) => ligne.id !== variables.enfant))
      await invalider()
      toast({ title: 'Relation enregistrée.' })
    },
    onError: (error: unknown) => {
      toast({ title: extractApiError(error), variant: 'error' })
    },
  })

  const suppression = useMutation({
    mutationFn: (enfant: string) => supprimerRelation(enfant),
    onSuccess: async () => {
      await invalider()
      toast({ title: 'Relation supprimée.' })
    },
    onError: (error: unknown) => {
      toast({ title: extractApiError(error), variant: 'error' })
    },
  })

  const idsEnAttente = enAttente.map((ligne) => ligne.id)
  // Sur la liste complète, pas sur la liste filtrée : un individu masqué par le
  // filtre reste rattaché et ne doit pas réapparaître dans le sélecteur d'ajout.
  const idsDejaRattaches = toutesRelations.map((relation) => relation.enfant.id)

  const ajouterLigne = (id: string) => {
    const individu = individus.find((candidat) => candidat.id === id)
    if (!individu) return
    setEnAttente((lignes) => [
      { id: individu.id, nom: individu.nom, referentiel: individu.referentiel },
      ...lignes,
    ])
  }

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Relations</span>
      </Breadcrumb>
      <PageHeading
        title="Relations"
        subtitle={
          <>
            {total} relation{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-red-marianne' : undefined}>{environment}</b>
          </>
        }
      />

      {locked ? (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-red-marianne/30 bg-surface px-4 py-3">
          <p className="text-sm text-text">
            Environnement de production : l’édition des relations est verrouillée.
          </p>
          <Button variant="secondary" type="button" onClick={unlock}>
            Déverrouiller
          </Button>
        </div>
      ) : null}

      <div className="mb-6 max-w-md">
        <p className="mb-1.5 text-xs font-semibold text-text">Ajouter une relation</p>
        <IndividuPicker
          excludedIds={[...idsDejaRattaches, ...idsEnAttente]}
          filtre={(individu) => individu.parents.length === 0}
          onSelect={ajouterLigne}
          placeholder="Rechercher un individu…"
          disabled={locked}
        />
      </div>

      <div className="mb-4">
        <SearchField
          label="Filtrer par nom d’individu"
          placeholder="Filtrer par nom d’individu…"
          value={recherche}
          onChange={setRecherche}
        />
      </div>

      {relations.length === 0 && enAttente.length === 0 ? (
        <EmptyState
          title={terme ? 'Aucun résultat' : 'Aucune relation'}
          description={
            terme
              ? 'Aucun individu ne correspond à ce filtre.'
              : 'Ajoutez un individu ci-dessus pour lui définir un parent.'
          }
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Individu</Table.HeaderCell>
              <Table.HeaderCell>Référentiel</Table.HeaderCell>
              <Table.HeaderCell>Parent</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {enAttente.map((ligne) => (
              <Table.Row key={`attente-${ligne.id}`} className="bg-surface-tinted">
                <Table.Cell>
                  <span className="font-semibold">{ligne.nom}</span>{' '}
                  <span className="font-mono text-xs text-text-muted">{ligne.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-xs text-text-muted">{ligne.referentiel}</span>
                </Table.Cell>
                <Table.Cell>
                  <IndividuPicker
                    excludedIds={[ligne.id]}
                    onSelect={(parent) => upsert.mutate({ enfant: ligne.id, parent })}
                    placeholder="Parent à choisir"
                    disabled={locked || upsert.isPending}
                  />
                </Table.Cell>
                <Table.Cell align="right">
                  <IconButton
                    variant="danger"
                    label="Retirer la ligne"
                    onClick={() =>
                      setEnAttente((lignes) => lignes.filter((autre) => autre.id !== ligne.id))
                    }
                  >
                    <Trash2 />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
            {relations.map((relation) => (
              <Table.Row key={relation.enfant.id}>
                <Table.Cell>
                  <span className="font-semibold">{relation.enfant.nom}</span>{' '}
                  <span className="font-mono text-xs text-text-muted">{relation.enfant.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-xs text-text-muted">
                    {relation.enfant.referentiel}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <IndividuPicker
                    excludedIds={[relation.enfant.id]}
                    value={relation.parent.id}
                    onSelect={(parent) => upsert.mutate({ enfant: relation.enfant.id, parent })}
                    disabled={locked || upsert.isPending}
                  />
                </Table.Cell>
                <Table.Cell align="right">
                  <IconButton
                    variant="danger"
                    label={`Supprimer la relation de ${relation.enfant.nom}`}
                    disabled={locked || suppression.isPending}
                    onClick={() => suppression.mutate(relation.enfant.id)}
                  >
                    <Trash2 />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
