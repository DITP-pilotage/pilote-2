import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Network } from 'lucide-react'
import { useState } from 'react'

import { upsertAxe } from '@/api/axes'
import { AxeForm, type AxeFormValues } from '@/components/AxeForm'
import { AxeGrapheModale } from '@/components/AxeGraphe'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ModalitesArbre } from '@/components/ModalitesArbre'
import { PageHeading } from '@/components/PageHeading'
import { ProdEditSectionHeader } from '@/components/ProdEditSectionHeader'
import { Button } from '@pilote/kpilote-ui/Button'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { axeModalitesQueryOptions, axeQueryOptions } from '@/queries/axes'

export const Route = createFileRoute('/_authed/axes/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.fetchQuery(axeQueryOptions(params.id)),
      context.queryClient.fetchQuery(axeModalitesQueryOptions(params.id)),
    ])
  },
  component: EditAxeComponent,
})

function EditAxeComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()
  const { data: axe } = useSuspenseQuery(axeQueryOptions(id))
  const { data: modalites } = useSuspenseQuery(axeModalitesQueryOptions(id))
  const [grapheOuvert, setGrapheOuvert] = useState(false)

  const initial: AxeFormValues = {
    id: axe.id,
    nom: axe.nom,
    description: axe.description ?? '',
    niveaux: axe.niveaux.map((niveau) => ({ nom: niveau.nom })),
  }

  const mutation = useMutation({
    mutationFn: (values: AxeFormValues) =>
      upsertAxe({
        id,
        body: {
          nom: values.nom.trim(),
          description: values.description.trim() === '' ? null : values.description,
          niveaux: values.niveaux.map((niveau) => ({ nom: niveau.nom.trim() })),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['axes'] })
      await queryClient.invalidateQueries({ queryKey: ['axe', id] })
      toast({ title: 'Axe modifié.' })
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
        <span className="font-medium text-text">{id}</span>
      </Breadcrumb>
      <PageHeading title="Modifier l’axe" subtitle={<code>PUT /axes/{id}</code>} />
      <AxeForm
        key={axe.updatedAt}
        mode="edit"
        initial={initial}
        pending={mutation.isPending}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/axes' })}
        onSubmit={(values) => mutation.mutate(values)}
      />

      <div className="mt-10 flex flex-col gap-4">
        <ProdEditSectionHeader
          titre={`${modalites.length} modalité${modalites.length > 1 ? 's' : ''}`}
          isProd={isProd}
          locked={locked}
          onUnlock={unlock}
          confirmation="Déverrouiller l'édition des modalités en PRODUCTION ?"
        />
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setGrapheOuvert(true)}>
            <Network />
            Voir le graphe de calcul
          </Button>
        </div>
        <ModalitesArbre axeId={id} niveaux={axe.niveaux} modalites={modalites} disabled={locked} />
      </div>

      <AxeGrapheModale
        open={grapheOuvert}
        onClose={() => setGrapheOuvert(false)}
        axe={axe}
        modalites={modalites}
        locked={locked}
      />
    </div>
  )
}
