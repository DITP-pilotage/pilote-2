import { Mail } from 'lucide-react'

export function ContacterEquipe() {
  return (
    <a
      href="mailto:pilote.ditp@modernisation.gouv.fr"
      className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-tinted sm:inline-flex"
    >
      <Mail className="size-5" />
      Contacter l'équipe KPILOTE
    </a>
  )
}
