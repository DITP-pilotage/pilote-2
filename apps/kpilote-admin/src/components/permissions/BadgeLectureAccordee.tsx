import { Eye } from 'lucide-react'

// La lecture est toujours accordée à une ligne présente dans la liste : on
// l'affiche comme un état, pas comme un contrôle. `title` précise ce qu'est la
// ligne (une ressource, un principal) selon l'écran.
export function BadgeLectureAccordee({ title }: { title: string }) {
  return (
    <span title={title} className="flex items-center gap-1 text-xs font-medium text-text-muted">
      <Eye className="size-3.5" /> Lecture
    </span>
  )
}
