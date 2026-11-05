import type { CentreAideOutput } from '@pilote/kpilote-shared/assistant/tools'
import { Link } from '@tanstack/react-router'
import { BookOpen, Mail } from 'lucide-react'

/**
 * Sous la réponse, ce que le centre d'aide a fourni. Les liens sont construits par le code
 * à partir des sources de l'outil, jamais recopiés du texte du modèle.
 */
export function CentreAideEncart({ output }: { output: CentreAideOutput }) {
  if (!output.found) {
    return (
      <section className="flex flex-col gap-2 border-l-4 border-primary bg-primary-tinted p-4 text-sm">
        <p className="m-0 font-bold text-text">
          Le centre d&apos;aide ne couvre pas cette question.
        </p>
        <a
          href="mailto:pilote.ditp@modernisation.gouv.fr?subject=Support%20KPILOTE"
          className="inline-flex items-center gap-2 self-start font-semibold text-primary underline-offset-4 hover:underline"
        >
          <Mail className="size-4" />
          Contacter l&apos;équipe KPILOTE
        </a>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-2 border-l-4 border-primary bg-primary-tinted p-4 text-sm">
      <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase">
        <BookOpen className="size-4" />
        Pages du centre d&apos;aide
      </span>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {output.sources.map((source) => (
          <li key={source.id}>
            <Link
              to="/centre-aide"
              search={{ article: source.id }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {source.titre}
            </Link>
            {source.chemin.length > 0 && (
              <span className="text-text-subtle"> — {source.chemin.join(' › ')}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
