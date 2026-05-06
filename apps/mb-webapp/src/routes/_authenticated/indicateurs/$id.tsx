import { indicateurPublicIdSchema } from '@pilote/mb-shared/indicateur'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { indicateurQueryOptions } from '@/queries/indicateurs'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  loader: ({ context, params }) =>
    context.queryClient.fetchQuery(indicateurQueryOptions(params.id)),
  pendingComponent: () => <RouteLoading message="Chargement de l'indicateur…" />,
  errorComponent: RouteError,
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
          {data.id}
        </span>
        <h1 className="text-3xl font-semibold">{data.nom}</h1>
      </header>

      <section className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p>Créé le {new Date(data.createdAt).toLocaleString('fr-FR')}</p>
        <p>Mis à jour le {new Date(data.updatedAt).toLocaleString('fr-FR')}</p>
      </section>

      <section className="rounded border border-slate-200 bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>
            ✓ Route param <code>id</code> = <strong>{id}</strong>
          </li>
          <li>✓ Loader détail exécuté</li>
          <li>✓ useSuspenseQuery (cache partagé avec liste)</li>
        </ul>
      </section>
    </div>
  )
}
