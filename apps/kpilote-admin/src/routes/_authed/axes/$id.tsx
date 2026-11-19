import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Network } from 'lucide-react'
import { useState } from 'react'

import { AxeForm, type AxeFormValues } from '@/components/AxeForm'
import { AxeGrapheModale } from '@/components/axe-graphe/AxeGrapheModale'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ModalitesArbre } from '@/components/ModalitesArbre'
import { PageHeading } from '@/components/PageHeading'
import { ProdEditSectionHeader } from '@/components/ProdEditSectionHeader'
import { Button } from '@pilote/kpilote-ui/Button'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { useUpsertAxe } from '@/mutations/axes'
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
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()
  const { data: axe } = useSuspenseQuery(axeQueryOptions(id))
  const { data: modalites } = useSuspenseQuery(axeModalitesQueryOptions(id))
  const [isGrapheOpen, setIsGrapheOpen] = useState(false)

  const initial: AxeFormValues = {
    id: axe.id,
    nom: axe.nom,
    description: axe.description ?? '',
    niveaux: axe.niveaux.map((niveau) => ({ nom: niveau.nom })),
  }

  const mutation = useUpsertAxe(id)
  const saveAxe = (values: AxeFormValues) =>
    mutation.mutate(
      {
        nom: values.nom.trim(),
        description: values.description.trim() === '' ? null : values.description,
        niveaux: values.niveaux.map((niveau) => ({ nom: niveau.nom.trim() })),
      },
      { onSuccess: () => toast({ title: 'Axe modifié.' }) },
    )

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
      <PageHeading
        title="Modifier l’axe"
        subtitle={<code>PUT /axes/{id}</code>}
        action={
          <Button onClick={() => setIsGrapheOpen(true)}>
            <Network />
            Voir le graphe de calcul
          </Button>
        }
      />
      <AxeForm
        mode="edit"
        initial={initial}
        pending={mutation.isPending}
        isProd={isProd}
        onCancel={() => void navigate({ to: '/axes' })}
        onSubmit={saveAxe}
      />

      <div className="mt-10 flex flex-col gap-4">
        <ProdEditSectionHeader
          titre={`${modalites.length} modalité${modalites.length > 1 ? 's' : ''}`}
          isProd={isProd}
          locked={locked}
          onUnlock={unlock}
          confirmation="Déverrouiller l'édition des modalités en PRODUCTION ?"
        />
        <ModalitesArbre axeId={id} niveaux={axe.niveaux} modalites={modalites} disabled={locked} />
      </div>

      <AxeGrapheModale
        open={isGrapheOpen}
        onClose={() => setIsGrapheOpen(false)}
        axe={axe}
        modalites={modalites}
        locked={locked}
      />
    </div>
  )
}
