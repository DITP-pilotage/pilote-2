import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { session } from '@/session'

export const Route = createFileRoute('/_authed/indicateurs/nouveau')({
  component: NewIndicateurComponent,
})

function NewIndicateurComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) =>
      upsertIndicateur(values.id, {
        nom: values.nom,
        visibilite: values.visibilite,
        unite: values.unite,
        referentiels: values.referentiels,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['indicateurs'] })
      void navigate({ to: '/indicateurs' })
    },
    onError: (err: unknown) => {
      void extractApiError(err).then(setError)
    },
  })

  return (
    <div>
      <PageHeading title="Nouvel indicateur" />
      <IndicateurForm
        mode="create"
        initial={buildInitialValues()}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
