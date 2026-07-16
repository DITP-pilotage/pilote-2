import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { createUtilisateur } from '@/api/utilisateurs'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { UtilisateurForm, type UtilisateurFormValues } from '@/components/UtilisateurForm'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiError'

export const Route = createFileRoute('/_authed/utilisateurs/nouveau')({
  component: NewUtilisateurComponent,
})

function NewUtilisateurComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: UtilisateurFormValues) => createUtilisateur(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      toast({ title: 'Utilisateur créé.' })
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
        <span className="font-medium text-text">Nouvel utilisateur</span>
      </Breadcrumb>
      <PageHeading title="Nouvel utilisateur" />
      <UtilisateurForm
        mode="create"
        pending={mutation.isPending}
        errorMessage={error}
        onCancel={() => void navigate({ to: '/utilisateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
