import type { RapportOutput } from '@pilote/kpilote-shared/assistant/tools'
import { Button } from '@pilote/kpilote-ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@pilote/kpilote-ui/DropdownMenu'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { ChevronDown, Copy, Download, FileText } from 'lucide-react'
import { useRef } from 'react'

import { NO_PRINT, printRapport } from './exportRapport'
import { MarkdownResponse } from './MarkdownResponse'
import { rapportFileName } from './rapport'

const TYPE_LABELS: Record<RapportOutput['type'], string> = {
  synthese: 'Synthèse',
  comparaison: 'Comparaison',
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * La synthèse ou la comparaison rédigée par le sous-agent, mise en page comme une note : elle
 * se remplit au fil de la rédaction. Une fois rédigée, son bouton « Exporter » la copie en
 * markdown ou la télécharge en PDF.
 */
export function RapportEncart({
  output,
  isStreaming,
}: {
  output: RapportOutput
  /** Une rédaction interrompue (arrêt, rechargement) ne reste pas « en cours ». */
  isStreaming: boolean
}) {
  const toast = useToast()
  const ref = useRef<HTMLElement>(null)
  const writing = isStreaming && !output.done
  const waitingForText = writing && output.markdown.trim() === ''
  const interrupted = !isStreaming && !output.done

  const copy = () => {
    navigator.clipboard
      .writeText(output.markdown)
      .then(() => toast({ title: 'Texte copié dans le presse-papiers' }))
      .catch(() => toast({ title: "Le texte n'a pas pu être copié", variant: 'error' }))
  }

  const downloadPdf = () => {
    const element = ref.current
    if (element === null) return
    printRapport({ element, title: rapportFileName(output) }).catch(() =>
      toast({ title: "Le PDF n'a pas pu être préparé", variant: 'error' }),
    )
  }

  return (
    <article
      ref={ref}
      data-rapport=""
      className="border border-border border-t-[5px] border-t-primary bg-surface px-6 py-6 shadow-md lg:px-10"
    >
      <header className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-3.5 text-[12.5px] leading-5 text-text-subtle">
        <p className="m-0 text-[13px] font-bold tracking-wide text-primary uppercase">
          {TYPE_LABELS[output.type]}
        </p>
        <div className="text-right">
          {output.dateRedaction && (
            <p className="m-0">{DATE_FORMAT.format(new Date(output.dateRedaction))}</p>
          )}
          <p className="m-0">À partir des données publiées dans kpilote</p>
        </div>
      </header>
      {waitingForText && <p className="mb-2 text-sm text-text-subtle">Rédaction en cours…</p>}
      {interrupted && (
        <p className="mb-3 border-l-4 border-l-warning bg-warning-tinted px-3 py-2 text-sm text-text">
          Rédaction interrompue : cet encart est incomplet.
        </p>
      )}
      <MarkdownResponse text={output.markdown} variant="report" />
      {output.done && (
        <footer className="mt-6 flex justify-end border-t border-border pt-4" {...NO_PRINT}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Download />
                Exporter
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuItem onSelect={copy}>
                <Copy className="text-primary" />
                Copier la synthèse
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={downloadPdf}>
                <FileText className="text-primary" />
                Télécharger en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </footer>
      )}
    </article>
  )
}
