import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { sendConsoleRequest, type ConsoleResponse } from '@/api/console'
import { CurlPreview } from '@/components/console/CurlPreview'
import { HistoryList } from '@/components/console/HistoryList'
import { RequestForm } from '@/components/console/RequestForm'
import { ResponsePanel } from '@/components/console/ResponsePanel'
import { PageHeading } from '@/components/PageHeading'
import {
  consoleFormSchema,
  emptyConsoleForm,
  toConsoleRequest,
  valuesFromHistory,
  type ConsoleFormValues,
} from '@/lib/consoleForm'
import { clearHistory, loadHistory, pushHistory, type HistoryEntry } from '@/lib/consoleHistory'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { consoleMetaQueryOptions } from '@/queries/console'

export const Route = createFileRoute('/_authed/console')({ component: ConsoleComponent })

// Section réponse isolée : sa `key` (submittedAt) change à chaque envoi, ce qui
// la remonte et redéclenche la callback ref → scroll vers le résultat.
function ResponseSection({
  response,
  pending,
  error,
}: {
  response: ConsoleResponse | null
  pending: boolean
  error: string | null
}) {
  const scrollIntoView = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  return (
    <div ref={scrollIntoView} className="scroll-mt-24 rounded-md border border-border p-4">
      <ResponsePanel response={response} pending={pending} error={error} />
    </div>
  )
}

function ConsoleComponent() {
  const { data: meta } = useQuery(consoleMetaQueryOptions)
  const { isProd, locked, unlock } = useProdEditUnlock()
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  // Incrémenté à chaque résultat/erreur : sert de `key` à la section réponse pour
  // la remonter (et redéclencher le scroll) quand le RÉSULTAT arrive, pas au submit.
  const [resultKey, setResultKey] = useState(0)

  const form = useForm<ConsoleFormValues>({
    resolver: zodResolver(consoleFormSchema),
    defaultValues: emptyConsoleForm,
  })

  const mutation = useMutation({
    mutationFn: (values: ConsoleFormValues) => sendConsoleRequest(toConsoleRequest(values)),
    onSuccess: (result, values) => {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        method: values.method,
        path: values.path,
        status: result.status,
        ts: Date.now(),
        request: toConsoleRequest(values),
      }
      setHistory(pushHistory(entry))
      setResultKey((key) => key + 1)
    },
    onError: () => setResultKey((key) => key + 1),
  })

  const baseUrl = (meta?.baseUrl ?? '').replace(/\/+$/, '')
  const errorMessage = mutation.isError
    ? mutation.error instanceof Error
      ? mutation.error.message
      : 'Échec de l’appel'
    : null

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeading title="Console API" subtitle={`Environnement : ${meta?.environment ?? '…'}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
          >
            <RequestForm
              baseUrl={baseUrl}
              isProd={isProd}
              locked={locked}
              unlock={unlock}
              isPending={mutation.isPending}
            />

            <CurlPreview baseUrl={baseUrl} />

            {mutation.submittedAt === 0 ? (
              <div className="scroll-mt-24 rounded-md border border-border p-4">
                <ResponsePanel response={null} pending={false} error={null} />
              </div>
            ) : (
              <ResponseSection
                key={resultKey}
                response={mutation.data ?? null}
                pending={mutation.isPending}
                error={errorMessage}
              />
            )}
          </form>
        </FormProvider>

        <aside className="rounded-md border border-border p-3">
          <HistoryList
            entries={history}
            onRestore={(entry) => form.reset(valuesFromHistory(entry))}
            onClear={() => {
              clearHistory()
              setHistory([])
            }}
          />
        </aside>
      </div>
    </div>
  )
}
