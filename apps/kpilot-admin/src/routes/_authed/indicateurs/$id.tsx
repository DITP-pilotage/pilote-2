import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertIndicateur } from '@/api/indicateurs'
import { Breadcrumb } from '@/components/Breadcrumb'
import { IndicateurForm } from '@/components/indicateurs/IndicateurForm'
import {
  buildInitialValues,
  toUpsertBody,
  type IndicateurFormValues,
} from '@/components/indicateurs/indicateurFormSchema'
import { PageHeading } from '@/components/PageHeading'
import { extractApiError } from '@/lib/apiError'
import { indicateurQueryOptions } from '@/queries/indicateurs'

export const Route = createFileRoute('/_authed/indicateurs/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(indicateurQueryOptions(params.id)),
  component: EditIndicateurComponent,
})

function EditIndicateurComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) => upsertIndicateur(id, toUpsertBody(values)),
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
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/indicateurs" className="hover:text-primary">
          Indicateurs
        </Link>
        <span className="font-medium text-text">{id}</span>
      </Breadcrumb>
      <PageHeading title="Modifier l'indicateur" subtitle={<code>PUT /indicateurs/{id}</code>} />
      <IndicateurForm
        mode="edit"
        initial={buildInitialValues(indicateur)}
        pending={mutation.isPending}
        errorMessage={error}
        onCancel={() => void navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
