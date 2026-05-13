import { indicateurPublicIdSchema } from '@pilote/mb-shared/indicateur'
import { type IndividuApiModel, individuPublicIdSchema } from '@pilote/mb-shared/individu'
import { referentielPublicIdSchema } from '@pilote/mb-shared/referentiel'
import { type ValeurDateApiModel } from '@pilote/mb-shared/valeurAvancement'
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { startTransition } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  indicateurQueryOptions,
  indicateurValeursQueryOptions,
  indicateurValeursRemarquablesQueryOptions,
  referentielIndividusQueryOptions,
} from '@/queries/indicateurs'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
})

const aggregateIndividus = (
  lists: ReadonlyArray<ReadonlyArray<IndividuApiModel>>,
): IndividuApiModel[] => {
  const dedup = new Map<string, IndividuApiModel>()
  for (const list of lists) for (const ind of list) if (!dedup.has(ind.id)) dedup.set(ind.id, ind)
  return [...dedup.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

const firstReferentielFor = (individu: IndividuApiModel): string | undefined =>
  individu.referentiels[0]

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individu: search.individu }),
  loader: async ({ context, params, deps }) => {
    const indicateur = await context.queryClient.fetchQuery(indicateurQueryOptions(params.id))

    if (indicateur.referentielIds.length === 0) return { indicateur }

    const lists = await Promise.all(
      indicateur.referentielIds.map((refId) =>
        context.queryClient.fetchQuery(referentielIndividusQueryOptions(refId)),
      ),
    )
    const individus = aggregateIndividus(lists)

    if (individus.length === 0) return { indicateur }

    const selected = deps.individu ? individus.find((i) => i.id === deps.individu) : undefined
    if (!selected) {
      const first = individus[0]!
      throw redirect({
        to: '/indicateurs/$id',
        params,
        search: { individu: first.id, referentiel: firstReferentielFor(first) },
        replace: true,
      })
    }

    await Promise.all([
      context.queryClient.fetchQuery(indicateurValeursQueryOptions(params.id, deps.individu!)),
      context.queryClient.fetchQuery(
        indicateurValeursRemarquablesQueryOptions(params.id, deps.individu!),
      ),
    ])

    return { indicateur }
  },
  pendingComponent: () => <RouteLoading message="Chargement de l'indicateur…" />,
  errorComponent: RouteError,
  component: IndicateurDetailComponent,
})

function IndicateurDetailComponent() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))
  const individus = useSuspenseQueries({
    queries: indicateur.referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => aggregateIndividus(results.map((r) => r.data)),
  })

  const selectedIndividu = search.individu
    ? individus.find((i) => i.id === search.individu)
    : undefined

  const noReferentiel = indicateur.referentielIds.length === 0
  const noIndividu = !noReferentiel && individus.length === 0

  return (
    <div className="space-y-6">
      <div>
        <Button variant="tertiary" size="sm" asChild>
          <Link to="/indicateurs" search={{}}>
            <ArrowLeft />
            Retour à la liste
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="text-3xl font-semibold text-text">{indicateur.nom}</h1>
      </header>

      {noReferentiel ? (
        <p className="rounded border border-border bg-surface p-6 text-sm text-text-muted">
          Aucun référentiel associé à cet indicateur.
        </p>
      ) : noIndividu ? (
        <p className="rounded border border-border bg-surface p-6 text-sm text-text-muted">
          Aucun individu disponible dans les référentiels liés.
        </p>
      ) : selectedIndividu === undefined ? null : (
        <>
          <StatistiquesPopulationSection indicateurId={id} individuId={selectedIndividu.id} />

          <div className="flex items-center gap-3">
            <label className="text-sm text-text-muted" htmlFor="individu-select">
              Individu
            </label>
            <Select
              value={selectedIndividu.id}
              onValueChange={(value) => {
                const next = individus.find((i) => i.id === value)
                startTransition(() => {
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      individu: value,
                      referentiel: next ? firstReferentielFor(next) : prev.referentiel,
                    }),
                  })
                })
              }}
            >
              <SelectTrigger id="individu-select" className="min-w-[16rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {individus.map((individu) => (
                  <SelectItem key={individu.id} value={individu.id}>
                    {individu.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ValeursRemarquablesSection indicateurId={id} individuId={selectedIndividu.id} />

          <Tabs defaultValue="valeurs">
            <TabsList>
              <TabsTrigger value="valeurs">Valeurs</TabsTrigger>
              <TabsTrigger value="metadonnees">Métadonnées</TabsTrigger>
            </TabsList>

            <TabsContent value="valeurs">
              <ValeursTable indicateurId={id} individuId={selectedIndividu.id} />
            </TabsContent>

            <TabsContent value="metadonnees">
              <MetadonneesPanel indicateur={indicateur} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function StatistiquesPopulationSection({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data } = useSuspenseQuery(
    indicateurValeursRemarquablesQueryOptions(indicateurId, individuId),
  )

  const numberFormatter = new Intl.NumberFormat('fr-FR')
  const formatStat = (value: number | null): string =>
    value === null ? '—' : numberFormatter.format(value)

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Minimum">
        <p className="text-3xl font-semibold text-text">{formatStat(data.min)}</p>
      </StatCard>
      <StatCard label="Maximum">
        <p className="text-3xl font-semibold text-text">{formatStat(data.max)}</p>
      </StatCard>
      <StatCard label="Médiane">
        <p className="text-3xl font-semibold text-text">{formatStat(data.mediane)}</p>
      </StatCard>
    </section>
  )
}

function ValeursRemarquablesSection({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: remarquables } = useSuspenseQuery(
    indicateurValeursRemarquablesQueryOptions(indicateurId, individuId),
  )
  const { data: valeurs } = useSuspenseQuery(
    indicateurValeursQueryOptions(indicateurId, individuId),
  )

  const derniereValeur = derniereValeurFromItems(valeurs.items)
  const variation = remarquables.items[0]?.variation ?? null

  const numberFormatter = new Intl.NumberFormat('fr-FR')
  const variationFormatter = new Intl.NumberFormat('fr-FR', { signDisplay: 'exceptZero' })

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <StatCard label="Valeur la plus récente">
        {derniereValeur ? (
          <>
            <p className="text-3xl font-semibold text-text">
              {numberFormatter.format(derniereValeur.valeur)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              au {new Date(derniereValeur.date).toLocaleDateString('fr-FR')}
            </p>
          </>
        ) : (
          <p className="text-3xl font-semibold text-text-muted">—</p>
        )}
      </StatCard>

      <StatCard label="Variation depuis la dernière MAJ">
        <p className={`text-3xl font-semibold ${variationColorClass(variation)}`}>
          {variation === null ? '—' : variationFormatter.format(variation)}
        </p>
      </StatCard>
    </section>
  )
}

const derniereValeurFromItems = (
  items: ReadonlyArray<{ date: string; valeur: number }>,
): ValeurDateApiModel | undefined => {
  if (items.length === 0) return undefined
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return { date: sorted[0]!.date, valeur: sorted[0]!.valeur }
}

const variationColorClass = (variation: number | null): string => {
  if (variation === null || variation === 0) return 'text-text-muted'
  return variation > 0 ? 'text-emerald-600' : 'text-rose-600'
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-text-muted">{label}</h2>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function ValeursTable({ indicateurId, individuId }: { indicateurId: string; individuId: string }) {
  const { data } = useSuspenseQuery(indicateurValeursQueryOptions(indicateurId, individuId))

  const rows = [...data.items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  if (rows.length === 0) {
    return (
      <p className="rounded border border-border bg-surface p-6 text-sm text-text-muted">
        Aucune valeur pour cet individu.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-secondary-hover text-text">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Date</th>
            <th className="px-4 py-2 text-right font-medium">Valeur</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.date}>
              <td className="px-4 py-2 text-text">
                {new Date(row.date).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-2 text-right text-text">
                {row.valeur.toLocaleString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MetadonneesPanel({
  indicateur,
}: {
  indicateur: { id: string; nom: string; createdAt: string; updatedAt: string }
}) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 rounded border border-border bg-surface p-6 text-sm">
      <dt className="text-text-muted">ID</dt>
      <dd className="text-text">{indicateur.id}</dd>

      <dt className="text-text-muted">Nom</dt>
      <dd className="text-text">{indicateur.nom}</dd>

      <dt className="text-text-muted">Créé le</dt>
      <dd className="text-text">{new Date(indicateur.createdAt).toLocaleString('fr-FR')}</dd>

      <dt className="text-text-muted">Mis à jour le</dt>
      <dd className="text-text">{new Date(indicateur.updatedAt).toLocaleString('fr-FR')}</dd>
    </dl>
  )
}
