import type { CreatedApiKeyApiModel } from '@pilote/kpilote-shared/apiKey'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { createApiKey } from '@/api/apiKeys'
import { ApiKeyForm, type ApiKeyFormValues } from '@/components/ApiKeyForm'
import { Breadcrumb } from '@/components/Breadcrumb'
import { CreatedApiKeyResult } from '@/components/CreatedApiKeyResult'
import { PageHeading } from '@/components/PageHeading'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiError'

export const Route = createFileRoute('/_authed/api-keys/nouveau')({
  component: NewApiKeyComponent,
})

function NewApiKeyComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [created, setCreated] = useState<CreatedApiKeyApiModel | null>(null)

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (values: ApiKeyFormValues) =>
      createApiKey({
        label: values.label,
        role: values.role,
        expiresAt: values.expiresAt === '' ? null : new Date(values.expiresAt).toISOString(),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast({ title: 'Clé API créée.' })
      setCreated(result)
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
        <Link to="/api-keys" className="hover:text-primary">
          Clés API
        </Link>
        <span className="font-medium text-text">Nouvelle clé</span>
      </Breadcrumb>
      <PageHeading title="Nouvelle clé API" />
      {created ? (
        <CreatedApiKeyResult
          rawKey={created.rawKey}
          label={created.label}
          onDone={() => void navigate({ to: '/api-keys' })}
        />
      ) : (
        <ApiKeyForm
          pending={mutation.isPending}
          onCancel={() => void navigate({ to: '/api-keys' })}
          onSubmit={(values) => mutation.mutate(values)}
        />
      )}
    </div>
  )
}
