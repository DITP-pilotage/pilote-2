import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { upsertAxe } from '@/api/axes'
import { AxeForm, type AxeFormValues } from '@/components/AxeForm'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { useAppConfig } from '@/context/AppConfigContext'

export const Route = createFileRoute('/_authed/axes/nouveau')({
  component: NewAxeComponent,
})

function NewAxeComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isProd } = useAppConfig()
  const toast = useToast()

  const mutation = useMutation({
    mutationFn: (values: AxeFormValues) =>
      upsertAxe({
        id: values.id,
        body: {
          nom: values.nom.trim(),
          description: values.description.trim() === '' ? null : values.description,
          niveaux: values.niveaux.map((nom) => ({ nom: nom.trim() })),
        },
      }),
    onSuccess: async (axe) => {
      await queryClient.invalidateQueries({ queryKey: ['axes'] })
      toast({ title: 'Axe créé. Ajoutez maintenant ses modalités.' })
      void navigate({ to: '/axes/$id', params: { id: axe.id } })
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
        <Link to="/axes" className="hover:text-primary">
          Axes
        </Link>
        <span className="font-medium text-text">Nouvel axe</span>
      </Breadcrumb>
      <PageHeading title="Nouvel axe" />
      <AxeForm
        mode="create"
        initial={{ id: '', nom: '', description: '', niveaux: [''] }}
        pending={mutation.isPending}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/axes' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
