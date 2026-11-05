import {
  DIMENSION_KEY_PATTERN,
  MAX_DIMENSION_SLOT,
  type AnalyticsDimension,
} from '@pilote/kpilote-shared/analytics/dimensions'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { deleteAnalyticsDimension, upsertAnalyticsDimension } from '@/api/analyticsDimensions'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { ProdEditSectionHeader } from '@/components/ProdEditSectionHeader'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Table } from '@pilote/kpilote-ui/Table'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import {
  ANALYTICS_DIMENSIONS_KEY,
  analyticsDimensionsQueryOptions,
} from '@/queries/analyticsDimensions'

export const Route = createFileRoute('/_authed/dimensions-matomo')({
  loader: ({ context }) => context.queryClient.fetchQuery(analyticsDimensionsQueryOptions()),
  component: DimensionsMatomoComponent,
})

type FormValues = { cle: string; slot: string; nom: string }

const EMPTY: FormValues = { cle: '', slot: '', nom: '' }

const INPUT =
  'rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-surface-tinted'

const isValid = (values: FormValues): boolean => {
  const slot = Number(values.slot)
  return (
    DIMENSION_KEY_PATTERN.test(values.cle) &&
    Number.isInteger(slot) &&
    slot >= 1 &&
    slot <= MAX_DIMENSION_SLOT &&
    values.nom.trim().length > 0
  )
}

function DimensionsMatomoComponent() {
  const { data: dimensions } = useSuspenseQuery(analyticsDimensionsQueryOptions())
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  const onError = (error: unknown) => toast({ title: extractApiError(error), variant: 'error' })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ANALYTICS_DIMENSIONS_KEY })

  const cancel = () => {
    setEditing(null)
    setValues(EMPTY)
  }

  const save = useMutation({
    mutationFn: (form: FormValues) =>
      upsertAnalyticsDimension(form.cle, { slot: Number(form.slot), nom: form.nom.trim() }),
    onSuccess: async () => {
      await refresh()
      toast({ title: editing ? 'Dimension modifiée.' : 'Dimension ajoutée.' })
      setValues(EMPTY)
      setEditing(null)
    },
    onError,
  })

  const remove = useMutation({
    mutationFn: deleteAnalyticsDimension,
    onSuccess: async (_data, cle) => {
      await refresh()
      setConfirming(null)
      if (cle === editing) cancel()
      toast({ title: 'Dimension supprimée.' })
    },
    onError,
  })

  const edit = (dimension: AnalyticsDimension) => {
    setEditing(dimension.cle)
    setValues({ cle: dimension.cle, slot: String(dimension.slot), nom: dimension.nom })
  }

  const disabled = locked || save.isPending || remove.isPending

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Dimensions Matomo</span>
      </Breadcrumb>
      <PageHeading
        title="Dimensions Matomo"
        subtitle="Range une clé de contexte des événements et pages vues dans une dimension personnalisée de Matomo. Sans correspondance, le contexte reste dans le nom de l’événement."
      />

      <div className="flex flex-col gap-6">
        <ProdEditSectionHeader
          titre={`${dimensions.length} dimension${dimensions.length > 1 ? 's' : ''}`}
          isProd={isProd}
          locked={locked}
          onUnlock={unlock}
          confirmation="Déverrouiller l'édition des dimensions Matomo en PRODUCTION ?"
        />

        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault()
            if (isValid(values)) save.mutate(values)
          }}
        >
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Clé de contexte
            <input
              value={values.cle}
              onChange={(event) =>
                setValues({ ...values, cle: event.target.value.trim().toLowerCase() })
              }
              placeholder="conversation_id"
              disabled={disabled || editing !== null}
              className={`${INPUT} w-56 font-mono`}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            N° de dimension
            <input
              type="number"
              min={1}
              max={MAX_DIMENSION_SLOT}
              value={values.slot}
              onChange={(event) => setValues({ ...values, slot: event.target.value })}
              disabled={disabled}
              className={`${INPUT} w-32`}
            />
          </label>
          <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-xs font-semibold">
            Libellé
            <input
              value={values.nom}
              onChange={(event) => setValues({ ...values, nom: event.target.value })}
              placeholder="Conversation de l’assistant"
              disabled={disabled}
              className={INPUT}
            />
          </label>
          <div className="flex gap-2">
            {editing ? (
              <Button type="button" variant="secondary" onClick={cancel} disabled={save.isPending}>
                Annuler
              </Button>
            ) : null}
            <Button type="submit" disabled={disabled || !isValid(values)}>
              {editing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
          <p className="m-0 w-full text-xs text-text-muted">
            Créez d’abord la dimension dans Matomo, de portée « Action » pour un contexte qui change
            d’une page à l’autre, puis reportez ici son numéro (1 à {MAX_DIMENSION_SLOT}). Clé :
            minuscules, chiffres et « _ ». Pour échanger deux numéros, passez par un numéro libre.
          </p>
        </form>

        {dimensions.length === 0 ? (
          <EmptyState
            title="Aucune dimension"
            description="Le contexte des événements part dans leur nom."
          />
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>N°</Table.HeaderCell>
                <Table.HeaderCell>Clé de contexte</Table.HeaderCell>
                <Table.HeaderCell>Libellé</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {dimensions.map((dimension) => (
                <Table.Row key={dimension.cle}>
                  <Table.Cell>
                    <span className="font-semibold">{dimension.slot}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-mono text-sm">{dimension.cle}</span>
                  </Table.Cell>
                  <Table.Cell>{dimension.nom}</Table.Cell>
                  <Table.Cell align="right">
                    <span className="inline-flex gap-1">
                      <IconButton
                        label={`Modifier ${dimension.cle}`}
                        disabled={disabled}
                        onClick={() => edit(dimension)}
                      >
                        <Pencil />
                      </IconButton>
                      {confirming === dimension.cle ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirming(null)}
                            disabled={remove.isPending}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => remove.mutate(dimension.cle)}
                            disabled={disabled}
                            className="bg-red-marianne hover:bg-red-marianne"
                          >
                            Supprimer
                          </Button>
                        </>
                      ) : (
                        <IconButton
                          variant="danger"
                          label={`Supprimer ${dimension.cle}`}
                          disabled={disabled}
                          onClick={() => setConfirming(dimension.cle)}
                        >
                          <Trash2 />
                        </IconButton>
                      )}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </div>
  )
}
