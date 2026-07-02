import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { createIndicateur } from '@/api/indicateurs'
import { Breadcrumb } from '@/components/Breadcrumb'
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
      createIndicateur({
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
        isProd={isProd}
        onCancel={() => void navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
