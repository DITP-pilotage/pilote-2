import { ChevronDown } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { RenduContenuHtml } from '@/components/editeur-riche/RenduContenuHtml'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { clsxm } from '@/lib/clsxm'

// Hauteur de l'aperçu replié (~3 lignes).
const PEEK = '4.5rem'
const PEEK_PX = 72

export function ContenuRepliable({ html }: { html: string }) {
  const contenuRef = useRef<HTMLDivElement>(null)
  const [ouvert, setOuvert] = useState(false)
  const [hauteur, setHauteur] = useState<number | null>(null)
  // On part de l'hypothèse « dépasse » pour replier les longs contenus dès le
  // premier rendu (pas de flash) ; la mesure ajuste ensuite.
  const [depasse, setDepasse] = useState(true)

  // ResizeObserver : mesure la hauteur réelle du contenu (indépendante du clamp
  // parent) et la tient à jour en cas de reflow (resize, retour à la ligne).
  useEffect(() => {
    const el = contenuRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setHauteur(el.offsetHeight)
      setDepasse(el.offsetHeight > PEEK_PX + 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Si le contenu ne dépasse pas l'aperçu, on l'affiche entièrement (pas de repli).
  const effectivementOuvert = ouvert || !depasse

  return (
    <Collapsible open={effectivementOuvert} onOpenChange={setOuvert}>
      <CollapsibleContent
        peek={PEEK}
        style={
          { '--collapsible-full': hauteur != null ? `${hauteur}px` : undefined } as CSSProperties
        }
      >
        <div ref={contenuRef}>
          <RenduContenuHtml html={html} className="text-sm leading-relaxed text-text" />
        </div>
      </CollapsibleContent>
      {depasse && (
        <CollapsibleTrigger className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronDown className={clsxm('size-4 transition-transform', ouvert && 'rotate-180')} />
          {ouvert ? 'Voir moins' : 'Voir plus'}
        </CollapsibleTrigger>
      )}
    </Collapsible>
  )
}
