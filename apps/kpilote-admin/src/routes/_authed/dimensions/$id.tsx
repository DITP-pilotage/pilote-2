import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { upsertDimension } from '@/api/dimensions'
import { Breadcrumb } from '@/components/Breadcrumb'
import { DimensionForm, type DimensionFormValues } from '@/components/DimensionForm'
import { PageHeading } from '@/components/PageHeading'
import { useAppConfig } from '@/context/AppConfigContext'
import { extractApiError } from '@/lib/apiError'
import { dimensionQueryOptions } from '@/queries/dimensions'
import { referentielsAllQueryOptions } from '@/queries/referentiels'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { Table } from '@pilote/kpilote-ui/Table'
import { useToast } from '@pilote/kpilote-ui/Toast'

export const Route = createFileRoute('/_authed/dimensions/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.fetchQuery(dimensionQueryOptions(params.id)),
      context.queryClient.fetchQuery(referentielsAllQueryOptions()),
    ])
  },
  component: EditDimensionComponent,
})

function EditDimensionComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isProd } = useAppConfig()
  const { data: dimension } = useSuspenseQuery(dimensionQueryOptions(id))
  const { data: referentiels } = useSuspenseQuery(referentielsAllQueryOptions())

  // Les niveaux viennent de `referentiel.dimension` (source de vérité du
  // rattachement) : la liste `dimension.referentiels` ne porte que les ids.
  const niveaux = referentiels.filter((referentiel) => referentiel.dimension === id)

  const initial: DimensionFormValues = {
    id: dimension.id,
    nom: dimension.nom,
    description: dimension.description ?? '',
  }

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: DimensionFormValues) =>
      upsertDimension(id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dimensions'] })
      await queryClient.invalidateQueries({ queryKey: ['dimension', id] })
      toast({ title: 'Dimension modifiée.' })
      void navigate({ to: '/dimensions' })
    },
    onError: (err: unknown) => {
      toast({ title: extractApiError(err), variant: 'error' })
    },
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/dimensions" className="hover:text-primary">
          Dimensions
        </Link>
        <span className="font-medium text-text">{id}</span>
      </Breadcrumb>
      <PageHeading title="Modifier la dimension" subtitle={<code>PUT /dimensions/{id}</code>} />
      <DimensionForm
        mode="edit"
        initial={initial}
        pending={mutation.isPending}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/dimensions' })}
        onSubmit={(values) => mutation.mutate(values)}
      />

      <section className="mt-8">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Niveaux</h2>
          <Link
            to="/relations"
            search={{ dimension: id }}
            className="text-sm font-semibold text-primary"
          >
            Gérer la hiérarchie →
          </Link>
        </div>
        <Subtitle className="mb-4">
          Un niveau est un référentiel rattaché à cette dimension ; ses individus sont les membres
          de la dimension. Le rattachement se modifie depuis la fiche du référentiel.
        </Subtitle>
        {niveaux.length === 0 ? (
          <EmptyState
            title="Aucun niveau"
            description="Rattachez un référentiel à cette dimension depuis sa fiche."
          />
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Nom</Table.HeaderCell>
                <Table.HeaderCell align="center">Membres</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {niveaux.map((referentiel) => (
                <Table.Row key={referentiel.id}>
                  <Table.Cell>
                    <span className="font-mono text-primary">{referentiel.id}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-semibold">{referentiel.nom}</span>
                  </Table.Cell>
                  <Table.Cell align="center">{referentiel.nombreIndividus}</Table.Cell>
                  <Table.Cell align="right">
                    <Link
                      to="/referentiels/$id"
                      params={{ id: referentiel.id }}
                      className="text-sm font-semibold text-primary"
                    >
                      Gérer les membres →
                    </Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </section>
    </div>
  )
}
