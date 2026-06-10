import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertReferentiel } from '@/api/referentiels'
import { PageHeading } from '@/components/PageHeading'
import { ReferentielForm, type ReferentielFormValues } from '@/components/ReferentielForm'
import { extractApiError } from '@/lib/apiError'
import { referentielIndividusQueryOptions, referentielQueryOptions } from '@/queries/referentiels'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/referentiels/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(referentielQueryOptions(params.id)),
      context.queryClient.ensureQueryData(referentielIndividusQueryOptions(params.id)),
    ])
  },
  component: EditReferentielComponent,
})

function EditReferentielComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(id))
  const { data: individus } = useSuspenseQuery(referentielIndividusQueryOptions(id))
  const [error, setError] = useState<string | null>(null)

  const initial: ReferentielFormValues = {
    id: referentiel.id,
    nom: referentiel.nom,
    description: referentiel.description ?? '',
    individus: individus.map((individu) => ({ publicId: individu.id, nom: individu.nom })),
  }

  const mutation = useMutation({
    mutationFn: (values: ReferentielFormValues) =>
      upsertReferentiel(id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
        individus: values.individus,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referentiels'] })
      await queryClient.invalidateQueries({ queryKey: ['referentiel', id] })
      void navigate({ to: '/referentiels' })
    },
    onError: (err: unknown) => {
      void extractApiError(err).then(setError)
    },
  })

  return (
    <div>
      <PageHeading title="Modifier le référentiel" subtitle={<code>PUT /referentiels/{id}</code>} />
      <ReferentielForm
        mode="edit"
        initial={initial}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/referentiels' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
