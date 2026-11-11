import type { ClarifyOutput } from '@pilote/kpilote-shared/assistant/tools'
import { ArrowRight, CircleHelp, Pencil } from 'lucide-react'
import { useId } from 'react'

export function ChoicesInline({
  question,
  choices,
  onChoose,
  onWriteOther,
}: ClarifyOutput & {
  onChoose: (label: string) => void
  onWriteOther: () => void
}) {
  const questionId = useId()
  return (
    <section
      aria-labelledby={questionId}
      className="flex flex-col gap-3 border-l-4 border-primary bg-primary-tinted p-4"
    >
      <div className="flex flex-col gap-1" id={questionId}>
        <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase">
          <CircleHelp className="size-4 shrink-0" />
          Précisez votre demande
        </span>
        <p className="m-0 font-bold text-text">{question}</p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {choices.map((choice) => (
          <li key={choice.value}>
            <button
              type="button"
              onClick={() => onChoose(choice.label)}
              className="group flex w-full items-center justify-between gap-3 border border-primary-tinted bg-surface px-4 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary-tinted"
            >
              {choice.label}
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onWriteOther}
        className="inline-flex items-center gap-1.5 self-start text-sm text-text-muted underline-offset-4 hover:text-primary hover:underline"
      >
        <Pencil className="size-4 shrink-0" />
        Autre chose ? Écrire ma demande
      </button>
    </section>
  )
}
