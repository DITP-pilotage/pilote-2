import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { upsertReferentiel } from '@/api/referentiels'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { ReferentielForm, type ReferentielFormValues } from '@/components/ReferentielForm'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { dimensionsAllQueryOptions } from '@/queries/dimensions'
import { referentielIndividusQueryOptions, referentielQueryOptions } from '@/queries/referentiels'
import { useAppConfig } from '@/context/AppConfigContext'

export const Route = createFileRoute('/_authed/referentiels/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.fetchQuery(referentielQueryOptions(params.id)),
      context.queryClient.fetchQuery(referentielIndividusQueryOptions(params.id)),
      context.queryClient.fetchQuery(dimensionsAllQueryOptions()),
    ])
  },
  component: EditReferentielComponent,
})

function EditReferentielComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isProd } = useAppConfig()
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(id))
  const { data: individus } = useSuspenseQuery(referentielIndividusQueryOptions(id))

  const initial: ReferentielFormValues = {
    id: referentiel.id,
    nom: referentiel.nom,
    description: referentiel.description ?? '',
    dimension: referentiel.dimension,
    individus: individus.map((individu) => ({ publicId: individu.id, nom: individu.nom })),
  }

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: ReferentielFormValues) =>
      upsertReferentiel(id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
        // Envoyée seulement si elle change : absente, l'API conserve l'existante.
        ...(values.dimension !== referentiel.dimension ? { dimension: values.dimension } : {}),
        individus: values.individus,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referentiels'] })
      await queryClient.invalidateQueries({ queryKey: ['referentiel', id] })
      await queryClient.invalidateQueries({ queryKey: ['dimensions'] })
      await queryClient.invalidateQueries({ queryKey: ['dimension'] })
      toast({ title: 'Référentiel modifié.' })
      void navigate({ to: '/referentiels' })
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
        <Link to="/referentiels" className="hover:text-primary">
          Référentiels
        </Link>
        <span className="font-medium text-text">{id}</span>
      </Breadcrumb>
      <PageHeading title="Modifier le référentiel" subtitle={<code>PUT /referentiels/{id}</code>} />
      <ReferentielForm
        mode="edit"
        initial={initial}
        pending={mutation.isPending}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/referentiels' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
