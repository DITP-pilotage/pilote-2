import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { upsertReferentiel } from '@/api/referentiels'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { ReferentielForm, type ReferentielFormValues } from '@/components/ReferentielForm'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { useAppConfig } from '@/context/AppConfigContext'

export const Route = createFileRoute('/_authed/referentiels/nouveau')({
  component: NewReferentielComponent,
})

function NewReferentielComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isProd } = useAppConfig()

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: ReferentielFormValues) =>
      upsertReferentiel(values.id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
        individus: values.individus,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referentiels'] })
      toast({ title: 'Référentiel créé.' })
      void navigate({ to: '/referentiels' })
    },
    onError: (err: unknown) => {
      void extractApiError(err).then((message) => toast({ title: message, variant: 'error' }))
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
        <span className="font-medium text-text">Nouveau référentiel</span>
      </Breadcrumb>
      <PageHeading title="Nouveau référentiel" />
      <ReferentielForm
        mode="create"
        initial={{ id: '', nom: '', description: '', individus: [] }}
        pending={mutation.isPending}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/referentiels' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
