import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { referentielsAllQueryOptions } from '@/queries/referentiels'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

export const Route = createFileRoute('/_authed/indicateurs/nouveau')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(referentielsAllQueryOptions()),
      context.queryClient.ensureQueryData(utilisateursAllQueryOptions()),
    ]),
  component: NewIndicateurComponent,
})

function NewIndicateurComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) => upsertIndicateur(values.id, toUpsertBody(values)),
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
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/indicateurs" className="hover:text-primary">
          Indicateurs
        </Link>
        <span className="font-medium text-text">Nouvel indicateur</span>
      </Breadcrumb>
      <PageHeading title="Nouvel indicateur" />
      <IndicateurForm
        mode="create"
        initial={buildInitialValues()}
        pending={mutation.isPending}
        errorMessage={error}
        onCancel={() => void navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
