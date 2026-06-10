import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertReferentiel } from '@/api/referentiels'
import { PageHeading } from '@/components/PageHeading'
import { ReferentielForm, type ReferentielFormValues } from '@/components/ReferentielForm'
import { extractApiError } from '@/lib/apiError'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/referentiels/nouveau')({
  component: NewReferentielComponent,
})

function NewReferentielComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: ReferentielFormValues) =>
      upsertReferentiel(values.id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
        individus: values.individus,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referentiels'] })
      void navigate({ to: '/referentiels' })
    },
    onError: (err: unknown) => {
      void extractApiError(err).then(setError)
    },
  })

  return (
    <div>
      <PageHeading title="Nouveau référentiel" />
      <ReferentielForm
        mode="create"
        initial={{ id: '', nom: '', description: '', individus: [] }}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/referentiels' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
