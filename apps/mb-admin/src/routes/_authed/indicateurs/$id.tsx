import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertIndicateur } from '@/api/indicateurs'
import {
  buildInitialValues,
  IndicateurForm,
  type IndicateurFormValues,
} from '@/components/IndicateurForm'
import { PageHeading } from '@/components/PageHeading'
import { extractApiError } from '@/lib/apiError'
import { indicateurQueryOptions } from '@/queries/indicateurs'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/indicateurs/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(indicateurQueryOptions(params.id)),
  component: EditIndicateurComponent,
})

function EditIndicateurComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) =>
      upsertIndicateur(id, {
        nom: values.nom,
        visibilite: values.visibilite,
        unite: values.unite,
        referentiels: values.referentiels,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['indicateurs'] })
      await queryClient.invalidateQueries({ queryKey: ['indicateur', id] })
      void navigate({ to: '/indicateurs' })
    },
    onError: (err: unknown) => {
      void extractApiError(err).then(setError)
    },
  })

  return (
    <div>
      <PageHeading title="Modifier l'indicateur" subtitle={<code>PUT /indicateurs/{id}</code>} />
      <IndicateurForm
        mode="edit"
        initial={buildInitialValues(indicateur)}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
