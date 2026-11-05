import type { AdminAppel } from '@pilote/kpilote-shared/assistant/admin'
import { CATEGORY_LABELS } from '@pilote/kpilote-shared/assistant/feedback'
import { formatDate } from '@pilote/kpilote-shared/formatDate'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { assistantTurns } from '@/lib/assistantTurns'
import { assistantConversationQueryOptions } from '@/queries/assistant'

export const Route = createFileRoute('/_authed/assistant/conversations/$id')({
  loader: ({ context, params }) =>
    context.queryClient.fetchQuery(assistantConversationQueryOptions(params.id)),
  component: ConversationComponent,
})

const numberFormat = new Intl.NumberFormat('fr-FR')

function Evaluation({ appel }: { appel: AdminAppel }) {
  if (!appel.evaluation && !appel.commentaire) {
    return <p className="m-0 text-xs text-text-subtle">Pas de retour.</p>
  }
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {appel.evaluation === 'POSITIVE' ? (
          <span className="rounded-full bg-success-tinted px-2 py-0.5 text-xs font-semibold text-success">
            👍 Positif
          </span>
        ) : null}
        {appel.evaluation === 'NEGATIVE' ? (
          <span className="rounded-full bg-error-tinted px-2 py-0.5 text-xs font-semibold text-error">
            👎 Négatif
          </span>
        ) : null}
        {appel.categories.map((categorie) => (
          <span
            key={categorie}
            className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted"
          >
            {CATEGORY_LABELS[categorie].title}
          </span>
        ))}
      </div>
      {appel.commentaire ? (
        <p className="m-0 whitespace-pre-wrap text-text">« {appel.commentaire} »</p>
      ) : null}
    </div>
  )
}

function AppelDetails({ appel }: { appel: AdminAppel }) {
  return (
    <div className="flex flex-col gap-3">
      <Evaluation appel={appel} />
      <p className="m-0 text-xs text-text-subtle">
        {appel.modele} · {numberFormat.format(appel.inputTokens)} tokens en entrée,{' '}
        {numberFormat.format(appel.outputTokens)} en sortie ·{' '}
        {numberFormat.format(Math.round(appel.dureeMs / 100) / 10)} s
      </p>
    </div>
  )
}

function ConversationComponent() {
  const { id } = Route.useParams()
  const { data: conversation } = useSuspenseQuery(assistantConversationQueryOptions(id))
  const { turns, replaced } = assistantTurns(conversation.messages, conversation.appels)

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/assistant" search={{ onglet: 'conversations' }} className="hover:text-primary">
          Assistant IA
        </Link>
        <span className="font-medium text-text">Conversation</span>
      </Breadcrumb>
      <PageHeading
        title={conversation.titre}
        subtitle={`Créée le ${formatDate(conversation.createdAt)} · mise à jour le ${formatDate(conversation.updatedAt)} · ${turns.length} question${turns.length > 1 ? 's' : ''}`}
      />

      <ol className="flex flex-col gap-6">
        {turns.map((turn, index) => (
          <li key={index} className="rounded-xl border border-border bg-surface p-6">
            <p className="m-0 mb-1 text-xs font-semibold tracking-wide text-text-muted uppercase">
              Question {index + 1}
            </p>
            <p className="m-0 mb-4 font-semibold whitespace-pre-wrap text-text">{turn.question}</p>
            <p className="m-0 mb-1 text-xs font-semibold tracking-wide text-text-muted uppercase">
              Réponse
            </p>
            <p className="m-0 mb-4 text-sm whitespace-pre-wrap text-text">
              {turn.reponse || <span className="text-text-subtle">Pas de réponse.</span>}
            </p>
            {turn.appel ? (
              <div className="border-t border-border pt-4">
                <AppelDetails appel={turn.appel} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {replaced.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-text">
            Réponses remplacées par une relance ({replaced.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {replaced.map((appel) => (
              <li key={appel.id} className="rounded-xl border border-border bg-surface-tinted p-4">
                <AppelDetails appel={appel} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
