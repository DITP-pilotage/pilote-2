import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

import { indicateurQueryOptions } from '@/queries/indicateurs'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(indicateurQueryOptions(params.id)),
  pendingComponent: () => (
    <div className="rounded border border-slate-200 bg-white p-6 text-slate-500">
      Chargement de l'indicateur…
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="space-y-3">
      <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Indicateur introuvable</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
      <Link
        to="/indicateurs"
        search={{}}
        className="inline-block text-sm text-slate-700 underline hover:text-slate-900"
      >
        ← Retour à la liste
      </Link>
    </div>
  ),
  component: IndicateurDetailComponent,
})

function IndicateurDetailComponent() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(indicateurQueryOptions(id))

  return (
    <div className="space-y-6">
      <Link
        to="/indicateurs"
        search={{}}
        className="text-sm text-slate-700 underline hover:text-slate-900"
      >
        ← Retour à la liste
      </Link>

      <header>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {data.statut}
        </span>
        <h1 className="text-3xl font-semibold">{data.nom}</h1>
        <p className="mt-1 text-2xl text-slate-700">
          {data.valeur} <span className="text-base text-slate-500">{data.unite}</span>
        </p>
      </header>

      <section className="rounded border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium text-slate-500">Description</h2>
        <p className="mt-2 text-slate-800">{data.description}</p>
      </section>

      <section className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p>
          Créé le {new Date(data.createdAt).toLocaleString('fr-FR')}
        </p>
        <p>
          Mis à jour le {new Date(data.updatedAt).toLocaleString('fr-FR')}
        </p>
        <p>ID interne : {data.id}</p>
      </section>

      <section className="rounded border border-slate-200 bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>
            ✓ Route param <code>id</code> parsé en number :{' '}
            <strong>{id}</strong> (typeof : {typeof id})
          </li>
          <li>✓ Loader détail exécuté</li>
          <li>✓ useSuspenseQuery (cache partagé avec liste)</li>
        </ul>
      </section>
    </div>
  )
}
