import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { updateUtilisateur } from '@/api/utilisateurs'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { UtilisateurForm, type UtilisateurFormValues } from '@/components/UtilisateurForm'
import { extractApiError } from '@/lib/apiError'
import { utilisateurQueryOptions } from '@/queries/utilisateurs'

export const Route = createFileRoute('/_authed/utilisateurs/$id')({
  component: EditUtilisateurComponent,
})

function EditUtilisateurComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const query = useQuery(utilisateurQueryOptions(id))

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
      await queryClient.invalidateQueries({ queryKey: ['utilisateurs', id] })
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

      {query.isLoading ? (
        <p className="text-sm text-text-muted">Chargement…</p>
      ) : query.isError || !query.data ? (
        <p className="text-sm font-medium text-accent">Utilisateur introuvable.</p>
      ) : (
        <UtilisateurForm
          mode="update"
          initialValues={{
            email: query.data.email,
            nom: query.data.nom,
            prenom: query.data.prenom,
            service: query.data.service,
            fonction: query.data.fonction,
          }}
          pending={mutation.isPending}
          errorMessage={error}
          onCancel={() => void navigate({ to: '/utilisateurs' })}
          onSubmit={(values) => mutation.mutate(values)}
        />
      )}
    </div>
  )
}
