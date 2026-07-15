import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { updateUtilisateur } from '@/api/utilisateurs'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { PrincipalPermissions } from '@/components/PrincipalPermissions'
import { TabNav } from '@/components/ui/TabNav'
import { UtilisateurForm, type UtilisateurFormValues } from '@/components/UtilisateurForm'
import { extractApiError } from '@/lib/apiError'
import { principalPermissionsQueryOptions } from '@/queries/permissions'
import { utilisateurQueryOptions } from '@/queries/utilisateurs'

export const Route = createFileRoute('/_authed/utilisateurs/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(utilisateurQueryOptions(params.id)),
      context.queryClient.ensureQueryData(principalPermissionsQueryOptions(params.id)),
    ])
  },
  component: EditUtilisateurComponent,
})

function EditUtilisateurComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'identite' | 'permissions'>('identite')

  const { data: utilisateur } = useSuspenseQuery(utilisateurQueryOptions(id))

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
      await navigate({ to: '/utilisateurs' })
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
        <Link to="/utilisateurs" className="hover:text-primary">
          Utilisateurs
        </Link>
        <span className="font-medium text-text">Modifier</span>
      </Breadcrumb>
      <PageHeading title="Modifier l'utilisateur" />

      <TabNav
        tabs={[
          { key: 'identite', label: 'Identité' },
          { key: 'permissions', label: 'Permissions' },
        ]}
        active={tab}
        onChange={(key) => setTab(key as 'identite' | 'permissions')}
      />

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
            errorMessage={error}
            onCancel={() => void navigate({ to: '/utilisateurs' })}
            onSubmit={(values) => mutation.mutate(values)}
          />
        ) : (
          <p className="text-sm font-medium text-accent">Utilisateur introuvable.</p>
        )
      ) : (
        <div>
          <PrincipalPermissions principalId={id} />
        </div>
      )}
    </div>
  )
}
