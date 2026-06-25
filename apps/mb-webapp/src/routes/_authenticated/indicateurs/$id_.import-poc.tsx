import { indicateurPublicIdSchema } from '@pilote/mb-shared/publicIds'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import Papa from 'papaparse'
import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { z } from 'zod'

import {
  NormaliserError,
  normaliserFichierPoc,
  type ItemNormalise,
  type NormaliserResponse,
  type Plan,
  type Resolution,
} from '@/api/importPoc'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Page } from '@/components/ui/Page'
import { Heading, Text } from '@/components/ui/Typography'
import { indicateurQueryOptions, loadIndicateur } from '@/queries/indicateurs'

const paramsSchema = z.object({ id: indicateurPublicIdSchema })

export const Route = createFileRoute('/_authenticated/indicateurs/$id_/import-poc')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    const indicateur = await loadIndicateur({ queryClient, indicateurId: params.id })
    return { indicateur }
  },
  pendingComponent: () => <RouteLoading message="Chargement de l'indicateur…" />,
  errorComponent: RouteError,
  component: ImportPocComponent,
})

type ParsedFichier = {
  nomFichier: string
  rows: Array<Record<string, unknown>>
  source: 'csv' | 'excel'
}

const parseCsv = async (file: File): Promise<Array<Record<string, unknown>>> => {
  const text = await file.text()
  return await new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (cause: unknown) =>
        reject(cause instanceof Error ? cause : new Error(String(cause))),
    })
  })
}

const parseExcel = async (file: File): Promise<Array<Record<string, unknown>>> => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = workbook.Sheets[firstSheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
}

const parseFile = async (file: File): Promise<ParsedFichier> => {
  const nom = file.name.toLowerCase()
  if (nom.endsWith('.csv') || nom.endsWith('.tsv') || nom.endsWith('.txt')) {
    const rows = await parseCsv(file)
    return { nomFichier: file.name, rows, source: 'csv' }
  }
  if (nom.endsWith('.xlsx') || nom.endsWith('.xls') || nom.endsWith('.ods')) {
    const rows = await parseExcel(file)
    return { nomFichier: file.name, rows, source: 'excel' }
  }
  throw new Error(`Format de fichier non reconnu (extensions supportées : .csv, .tsv, .txt, .xlsx, .xls, .ods).`)
}

const formatCellule = (cellule: unknown): string => {
  if (cellule === null || cellule === undefined) return ''
  if (typeof cellule === 'string' || typeof cellule === 'number' || typeof cellule === 'boolean') {
    return String(cellule)
  }
  return JSON.stringify(cellule)
}

const itemsToCsv = (items: ReadonlyArray<ItemNormalise>): string => {
  const header = 'individu,date,valeur'
  const lignes = items.map((item) => `${item.individu},${item.date},${item.valeur}`)
  return [header, ...lignes].join('\n')
}

const downloadText = (text: string, nomFichier: string, mime: string) => {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  URL.revokeObjectURL(url)
}

function ImportPocComponent() {
  const { id } = Route.useParams()
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))

  const [parsed, setParsed] = useState<ParsedFichier | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ rows, nomFichier }: { rows: Array<Record<string, unknown>>; nomFichier: string }) =>
      normaliserFichierPoc({ indicateurId: id, rows, nomFichier }),
  })

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setParseError(null)
    mutation.reset()
    try {
      const result = await parseFile(file)
      setParsed(result)
    } catch (cause) {
      setParsed(null)
      setParseError(cause instanceof Error ? cause.message : 'Erreur de parsing inattendue.')
    }
  }

  const lancerNormalisation = () => {
    if (!parsed) return
    mutation.mutate({ rows: parsed.rows, nomFichier: parsed.nomFichier })
  }

  const previewColonnes = useMemo(() => {
    if (!parsed || parsed.rows.length === 0) return []
    const colonnes = new Set<string>()
    for (const row of parsed.rows) for (const key of Object.keys(row)) colonnes.add(key)
    return [...colonnes]
  }, [parsed])

  const back = (
    <BackLink asChild>
      <Link to="/indicateurs/$id" params={{ id }}>
        Retour à l'indicateur
      </Link>
    </BackLink>
  )

  return (
    <Page
      kicker="POC — Import intelligent"
      title={`Importer dans « ${indicateur.nom} »`}
      description="Téléversez un fichier CSV ou Excel : Albert normalise son contenu vers le format batch de l'indicateur. Le POC s'arrête à l'affichage du JSON ; rien n'est encore écrit en base."
      back={back}
    >
      <section className="space-y-4">
        <Heading as="h2" size="display-sm">
          1. Téléverser un fichier
        </Heading>
        <input
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls,.ods"
          onChange={(event) => {
            void onFileChange(event)
          }}
          className="block w-full max-w-md rounded-md border border-border bg-surface px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary-hover"
        />
        {parseError && (
          <Text tone="muted" className="text-red-600">
            {parseError}
          </Text>
        )}
        {parsed && (
          <div className="space-y-3 rounded-md border border-border bg-surface-tinted p-4">
            <Text>
              <strong>{parsed.nomFichier}</strong> — {parsed.rows.length} ligne
              {parsed.rows.length > 1 ? 's' : ''} détectée
              {parsed.rows.length > 1 ? 's' : ''} ({parsed.source.toUpperCase()})
            </Text>
            {previewColonnes.length > 0 && (
              <div className="max-h-[40vh] overflow-auto rounded-md border border-border bg-surface">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-surface-tinted">
                    <tr>
                      <th className="border-b border-border px-2 py-1 text-right font-semibold text-text-muted">
                        #
                      </th>
                      {previewColonnes.map((colonne) => (
                        <th
                          key={colonne}
                          className="border-b border-border px-2 py-1 text-left font-semibold"
                        >
                          {colonne}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, index) => (
                      <tr key={index} className="odd:bg-surface even:bg-surface-tinted/40">
                        <td className="border-b border-border px-2 py-1 text-right text-text-muted tabular-nums">
                          {index}
                        </td>
                        {previewColonnes.map((colonne) => (
                          <td key={colonne} className="border-b border-border px-2 py-1">
                            {formatCellule(row[colonne])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <Heading as="h2" size="display-sm">
          2. Normaliser avec Albert
        </Heading>
        <Button
          type="button"
          onClick={lancerNormalisation}
          disabled={!parsed || mutation.isPending}
        >
          {mutation.isPending ? 'Normalisation en cours…' : 'Lancer la normalisation'}
        </Button>
        {mutation.isError && <ErreurNormalisation cause={mutation.error} />}
      </section>

      {mutation.data && (
        <ResultatNormalisation resultat={mutation.data} indicateurNom={indicateur.nom} />
      )}
    </Page>
  )
}

function ErreurNormalisation({ cause }: { cause: unknown }) {
  if (cause instanceof NormaliserError) {
    const { code, message, details } = cause.payload
    return (
      <div className="space-y-2 rounded-md border border-red-300 bg-red-50 p-4 text-red-900">
        <div className="flex items-center gap-2">
          <code className="rounded bg-white px-1.5 py-0.5 text-xs font-semibold">{code}</code>
          <span className="text-sm">{message}</span>
        </div>
        {details ? (
          <pre className="overflow-auto rounded bg-white p-2 text-xs">
            {JSON.stringify(details, null, 2)}
          </pre>
        ) : null}
      </div>
    )
  }
  const message = cause instanceof Error ? cause.message : 'Erreur inattendue.'
  return <Text className="text-red-600">Erreur : {message}</Text>
}

function ResultatNormalisation({
  resultat,
  indicateurNom,
}: {
  resultat: NormaliserResponse
  indicateurNom: string
}) {
  const bodyBatch = { items: resultat.items }
  const json = JSON.stringify(bodyBatch, null, 2)

  return (
    <section className="space-y-6">
      <Heading as="h2" size="display-sm">
        3. Résultat
      </Heading>

      <PlanInspecteur plan={resultat.plan} />

      <div className="grid gap-3 sm:grid-cols-5">
        <Stat label="Lignes du fichier" value={resultat.rapport.totalLignes} />
        <Stat label="Libellés distincts" value={resultat.rapport.totalLibellesSources} />
        <Stat label="Mappés" value={resultat.rapport.totalLibellesMappes} highlight />
        <Stat label="Non résolus" value={resultat.rapport.totalLibellesNonResolus} />
        <Stat label="Items produits" value={resultat.rapport.totalItemsProduits} highlight />
      </div>

      <ResolutionInspecteur resolution={resultat.resolution} />

      {resultat.warnings.length > 0 && (
        <div className="space-y-2 rounded-md border border-border bg-surface-tinted p-4">
          <Heading as="h3" size="md">
            Avertissements ({resultat.warnings.length})
          </Heading>
          <ul className="space-y-1 text-sm">
            {resultat.warnings.map((warning, index) => (
              <li key={index} className="flex flex-col gap-0.5">
                <span>
                  <code className="rounded bg-surface px-1.5 py-0.5 text-xs">{warning.code}</code>{' '}
                  — {warning.message}
                </span>
                {(warning.ligneSource !== undefined ||
                  warning.colonneSource ||
                  warning.libelleSource) && (
                  <span className="text-xs text-text-muted">
                    {warning.ligneSource !== undefined && `ligne #${warning.ligneSource} `}
                    {warning.colonneSource && `colonne « ${warning.colonneSource} » `}
                    {warning.libelleSource && `libellé « ${warning.libelleSource} »`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <Heading as="h3" size="md">
          Données normalisées ({resultat.items.length} ligne
          {resultat.items.length > 1 ? 's' : ''})
        </Heading>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(itemsToCsv(resultat.items))
            }}
          >
            Copier le CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              downloadText(
                itemsToCsv(resultat.items),
                `import-${indicateurNom.replace(/\W+/g, '-').toLowerCase()}.csv`,
                'text/csv',
              )
            }
          >
            Télécharger .csv
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(json)
            }}
          >
            Copier le JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              downloadText(
                json,
                `import-${indicateurNom.replace(/\W+/g, '-').toLowerCase()}.json`,
                'application/json',
              )
            }
          >
            Télécharger .json
          </Button>
        </div>
        {resultat.items.length === 0 ? (
          <Text tone="muted">Aucune ligne retenue.</Text>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-md border border-border bg-surface">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-surface-tinted">
                <tr>
                  <th className="border-b border-border px-3 py-2 text-left font-semibold">
                    Individu
                  </th>
                  <th className="border-b border-border px-3 py-2 text-left font-semibold">
                    Date
                  </th>
                  <th className="border-b border-border px-3 py-2 text-right font-semibold">
                    Valeur
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultat.items.map((item, index) => (
                  <tr key={index} className="odd:bg-surface even:bg-surface-tinted/40">
                    <td className="border-b border-border px-3 py-1.5 font-mono text-xs">
                      {item.individu}
                    </td>
                    <td className="border-b border-border px-3 py-1.5 font-mono text-xs">
                      {item.date}
                    </td>
                    <td className="border-b border-border px-3 py-1.5 text-right tabular-nums">
                      {item.valeur}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function PlanInspecteur({ plan }: { plan: Plan }) {
  return (
    <details className="rounded-md border border-border bg-surface-tinted p-4" open>
      <summary className="cursor-pointer font-semibold">
        Plan reconnu par Albert ({plan.layout})
      </summary>
      <div className="mt-3 space-y-2 text-sm">
        <div>
          <strong>Layout :</strong>{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-xs">{plan.layout}</code>
        </div>
        <div>
          <strong>Colonne individu :</strong>{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-xs">{plan.colonneIndividu}</code>
        </div>
        {plan.layout === 'long' ? (
          <>
            <div>
              <strong>Colonne date :</strong>{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                {plan.colonneDate.nom}
              </code>{' '}
              <span className="text-text-muted">(format : {plan.colonneDate.format})</span>
            </div>
            <div>
              <strong>Colonne valeur :</strong>{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs">{plan.colonneValeur}</code>
            </div>
          </>
        ) : (
          <div>
            <strong>Colonnes pivot :</strong>
            <ul className="ml-4 mt-1 list-disc space-y-0.5 text-xs">
              {plan.colonnesPivot.map((colonne) => (
                <li key={colonne.nom}>
                  <code className="rounded bg-surface px-1.5 py-0.5">{colonne.nom}</code>{' '}
                  →{' '}
                  <code className="rounded bg-surface px-1.5 py-0.5">{colonne.dateIso}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  )
}

function ResolutionInspecteur({ resolution }: { resolution: Resolution }) {
  if (resolution.mapping.length === 0 && resolution.nonResolus.length === 0) {
    return null
  }
  return (
    <details className="rounded-md border border-border bg-surface-tinted p-4">
      <summary className="cursor-pointer font-semibold">
        Résolution des individus ({resolution.mapping.length} mappés
        {resolution.nonResolus.length > 0 ? `, ${resolution.nonResolus.length} non résolus` : ''})
      </summary>
      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        {resolution.mapping.length > 0 && (
          <div>
            <Heading as="h4" size="sm" className="mb-1">
              Mapping
            </Heading>
            <div className="max-h-64 overflow-auto rounded border border-border bg-surface">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-surface-tinted">
                  <tr>
                    <th className="border-b border-border px-2 py-1 text-left">Libellé source</th>
                    <th className="border-b border-border px-2 py-1 text-left">→ publicId</th>
                  </tr>
                </thead>
                <tbody>
                  {resolution.mapping.map((entree, index) => (
                    <tr key={index} className="odd:bg-surface even:bg-surface-tinted/40">
                      <td className="border-b border-border px-2 py-1">{entree.libelleSource}</td>
                      <td className="border-b border-border px-2 py-1 font-mono">
                        {entree.individuPublicId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {resolution.nonResolus.length > 0 && (
          <div>
            <Heading as="h4" size="sm" className="mb-1">
              Non résolus
            </Heading>
            <div className="max-h-64 overflow-auto rounded border border-border bg-surface">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-surface-tinted">
                  <tr>
                    <th className="border-b border-border px-2 py-1 text-left">Libellé source</th>
                    <th className="border-b border-border px-2 py-1 text-left">Raison</th>
                  </tr>
                </thead>
                <tbody>
                  {resolution.nonResolus.map((entree, index) => (
                    <tr key={index} className="odd:bg-surface even:bg-surface-tinted/40">
                      <td className="border-b border-border px-2 py-1">{entree.libelleSource}</td>
                      <td className="border-b border-border px-2 py-1">{entree.raison}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </details>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-md border p-4 ${
        highlight ? 'border-primary bg-primary-tinted' : 'border-border bg-surface-tinted'
      }`}
    >
      <Text as="span" variant="kicker" tone="muted">
        {label}
      </Text>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
