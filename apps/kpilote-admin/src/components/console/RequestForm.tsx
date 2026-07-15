import { HTTP_METHODS, type HttpMethod } from '@pilote/kpilote-shared/console'
import { useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'

import { EndpointPicker } from '@/components/console/EndpointPicker'
import { HeadersEditor } from '@/components/console/HeadersEditor'
import { Button } from '@/components/ui/Button'
import { FieldSelect } from '@/components/ui/FieldSelect'
import { formatJson, JsonEditor } from '@/components/ui/JsonEditor'
import { TabNav } from '@/components/ui/TabNav'
import type { ConsoleFormValues } from '@/lib/consoleForm'

const MUTATING: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE'])

export function RequestForm({
  baseUrl,
  isProd,
  locked,
  unlock,
  isPending,
}: {
  baseUrl: string
  isProd: boolean
  locked: boolean
  unlock: () => void
  isPending: boolean
}) {
  const { control, register, setValue, getValues } = useFormContext<ConsoleFormValues>()
  const method = useWatch({ control, name: 'method' })
  const [tab, setTab] = useState<'body' | 'headers'>('body')

  // GET est bodyless : on masque l'onglet Body et on force l'affichage des en-têtes.
  const bodyless = method === 'GET'
  const activeTab = bodyless ? 'headers' : tab
  const blockedByProd = isProd && locked && MUTATING.has(method)

  return (
    <div className="flex flex-col gap-4">
      <EndpointPicker
        onSelect={(endpoint) => {
          setValue('method', endpoint.method)
          setValue('path', endpoint.path)
          if (endpoint.bodyExample) {
            setValue('body', endpoint.bodyExample)
            setTab('body')
          }
        }}
      />

      <div className="flex items-end gap-2">
        <Controller
          control={control}
          name="method"
          render={({ field }) => (
            <FieldSelect
              label="Méthode"
              hideLabel
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className="w-32"
            >
              {HTTP_METHODS.map((httpMethod) => (
                <option key={httpMethod} value={httpMethod}>
                  {httpMethod}
                </option>
              ))}
            </FieldSelect>
          )}
        />
        <div className="flex flex-1 items-center rounded-md border border-border">
          <span className="max-w-[45%] truncate px-2 py-2.5 text-xs text-text-muted">
            {baseUrl}
          </span>
          <input
            aria-label="Chemin de la requête"
            placeholder="/indicateurs?limit=10"
            className="flex-1 rounded-r-md px-2 py-2.5 text-sm focus:outline-none"
            {...register('path')}
          />
        </div>
        <Button type="submit" disabled={isPending || blockedByProd}>
          Envoyer
        </Button>
      </div>

      {blockedByProd ? (
        <div className="flex items-center justify-between rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-xs">
          <span>Mutation sur la prod verrouillée.</span>
          <button type="button" onClick={unlock} className="font-semibold text-accent">
            Déverrouiller
          </button>
        </div>
      ) : null}

      <div>
        <TabNav
          tabs={
            bodyless
              ? [{ key: 'headers', label: 'En-têtes' }]
              : [
                  { key: 'body', label: 'Body' },
                  { key: 'headers', label: 'En-têtes' },
                ]
          }
          active={activeTab}
          onChange={(key) => setTab(key as 'body' | 'headers')}
        />
        {activeTab === 'body' ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => setValue('body', formatJson(getValues('body')))}
              >
                Formater
              </Button>
            </div>
            <Controller
              control={control}
              name="body"
              render={({ field }) => (
                <JsonEditor
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Corps de la requête"
                />
              )}
            />
          </div>
        ) : (
          <Controller
            control={control}
            name="headers"
            render={({ field }) => (
              <HeadersEditor headers={field.value} onChange={field.onChange} />
            )}
          />
        )}
      </div>
    </div>
  )
}
