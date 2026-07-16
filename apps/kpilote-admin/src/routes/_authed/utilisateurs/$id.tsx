import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { updateUtilisateur } from '@/api/utilisateurs'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { PrincipalPermissions } from '@/components/PrincipalPermissions'
import { Tabs, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { UtilisateurForm, type UtilisateurFormValues } from '@/components/UtilisateurForm'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'
import { paniersAllQueryOptions } from '@/queries/paniers'
import { principalPermissionsQueryOptions } from '@/queries/permissions'
import { utilisateurQueryOptions } from '@/queries/utilisateurs'

export const Route = createFileRoute('/_authed/utilisateurs/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(utilisateurQueryOptions(params.id)),
      context.queryClient.ensureQueryData(principalPermissionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(indicateursAllQueryOptions()),
      context.queryClient.ensureQueryData(paniersAllQueryOptions()),
    ])
  },
  component: EditUtilisateurComponent,
})

function EditUtilisateurComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'identite' | 'permissions'>('identite')

  const { data: utilisateur } = useSuspenseQuery(utilisateurQueryOptions(id))

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: UtilisateurFormValues) =>
      updateUtilisateur(id, {
        nom: values.nom,
        prenom: values.prenom,
        service: values.service,
        fonction: values.fonction,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      toast({ title: 'Utilisateur modifié.' })
      await navigate({ to: '/utilisateurs' })
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
        <Link to="/utilisateurs" className="hover:text-primary">
          Utilisateurs
        </Link>
        <span className="font-medium text-text">Modifier</span>
      </Breadcrumb>
      <PageHeading title="Modifier l'utilisateur" />

      <Tabs value={tab} onValueChange={(key) => setTab(key as 'identite' | 'permissions')}>
        <TabsList className="mb-6">
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'identite' ? (
        utilisateur ? (
          <UtilisateurForm
            mode="update"
            initialValues={{
              email: utilisateur.email,
              nom: utilisateur.nom,
              prenom: utilisateur.prenom,
              service: utilisateur.service,
              fonction: utilisateur.fonction,
            }}
            pending={mutation.isPending}
            onCancel={() => void navigate({ to: '/utilisateurs' })}
            onSubmit={(values) => mutation.mutate(values)}
          />
        ) : (
          <p className="text-sm font-medium text-red-marianne">Utilisateur introuvable.</p>
        )
      ) : (
        <div>
          <PrincipalPermissions principalId={id} />
        </div>
      )}
    </div>
  )
}
