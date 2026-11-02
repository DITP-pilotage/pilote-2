import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { upsertDimension } from '@/api/dimensions'
import { Breadcrumb } from '@/components/Breadcrumb'
import { DimensionForm, type DimensionFormValues } from '@/components/DimensionForm'
import { PageHeading } from '@/components/PageHeading'
import { useAppConfig } from '@/context/AppConfigContext'
import { extractApiError } from '@/lib/apiError'
import { useToast } from '@pilote/kpilote-ui/Toast'

export const Route = createFileRoute('/_authed/dimensions/nouveau')({
  component: NewDimensionComponent,
})

function NewDimensionComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isProd } = useAppConfig()

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: DimensionFormValues) =>
      upsertDimension(values.id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
      }),
    onSuccess: async (dimension) => {
      await queryClient.invalidateQueries({ queryKey: ['dimensions'] })
      toast({ title: 'Dimension créée.' })
      // On rejoint la fiche : c'est là qu'on retrouve ses niveaux.
      void navigate({ to: '/dimensions/$id', params: { id: dimension.id } })
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
        <Link to="/dimensions" className="hover:text-primary">
          Dimensions
        </Link>
        <span className="font-medium text-text">Nouvelle dimension</span>
      </Breadcrumb>
      <PageHeading title="Nouvelle dimension" />
      <DimensionForm
        mode="create"
        initial={{ id: '', nom: '', description: '' }}
        pending={mutation.isPending}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/dimensions' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
