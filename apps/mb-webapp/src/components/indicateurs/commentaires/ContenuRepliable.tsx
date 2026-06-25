import { ChevronDown } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'

import { RenduContenuHtml } from '@/components/editeur-riche/RenduContenuHtml'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { clsxm } from '@/lib/clsxm'

// Hauteur de l'aperçu replié (~3 lignes).
const PEEK = '4.5rem'
const PEEK_PX = 72

export function ContenuRepliable({ html }: { html: string }) {
  const contenuRef = useRef<HTMLDivElement>(null)
  const [ouvert, setOuvert] = useState(false)
  // On part de l'hypothèse « dépasse » pour que les contenus longs soient repliés
  // dès le premier rendu (pas de flash). La mesure ajuste ensuite.
  const [depasse, setDepasse] = useState(true)

  useLayoutEffect(() => {
    const el = contenuRef.current
    // offsetHeight = hauteur réelle du contenu, indépendante du clamp parent.
    if (el) setDepasse(el.offsetHeight > PEEK_PX + 1)
  }, [html])

  // Si le contenu ne dépasse pas l'aperçu, on l'affiche entièrement (pas de repli).
  const effectivementOuvert = ouvert || !depasse

  return (
    <Collapsible open={effectivementOuvert} onOpenChange={setOuvert}>
      <CollapsibleContent peek={PEEK}>
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
