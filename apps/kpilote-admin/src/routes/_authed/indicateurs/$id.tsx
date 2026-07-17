import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { upsertIndicateur } from '@/api/indicateurs'
import { Breadcrumb } from '@/components/Breadcrumb'
import { IndicateurForm } from '@/components/indicateurs/IndicateurForm'
import {
  buildInitialValues,
  toUpsertBody,
  type IndicateurFormValues,
} from '@/components/indicateurs/indicateurFormSchema'
import { PageHeading } from '@/components/PageHeading'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { indicateurQueryOptions } from '@/queries/indicateurs'
import { referentielsAllQueryOptions } from '@/queries/referentiels'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

export const Route = createFileRoute('/_authed/indicateurs/$id')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(indicateurQueryOptions(params.id)),
      context.queryClient.ensureQueryData(referentielsAllQueryOptions()),
      context.queryClient.ensureQueryData(utilisateursAllQueryOptions()),
    ]),
  component: EditIndicateurComponent,
})

function EditIndicateurComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) => upsertIndicateur(id, toUpsertBody(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['indicateurs'] })
      await queryClient.invalidateQueries({ queryKey: ['indicateur', id] })
      toast({ title: 'Indicateur modifié.' })
      void navigate({ to: '/indicateurs' })
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
        onCancel={() => void navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
