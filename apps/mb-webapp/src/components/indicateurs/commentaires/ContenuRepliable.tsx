import { ChevronDown } from 'lucide-react'
import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'

import { RenduContenuHtml } from '@/components/editeur-riche/RenduContenuHtml'
import { Collapsible, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { clsxm } from '@/lib/clsxm'

// Hauteur de l'aperçu replié (~3 lignes).
const PEEK_PX = 72

export function ContenuRepliable({ html }: { html: string }) {
  const contenuRef = useRef<HTMLDivElement>(null)
  const [ouvert, setOuvert] = useState(false)
  // On part de l'hypothèse « dépasse » pour replier dès le premier rendu (pas
  // de flash) ; la mesure ajuste ensuite si le contenu est court.
  const [depasse, setDepasse] = useState(true)

  useEffect(() => {
    const el = contenuRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setDepasse(el.offsetHeight > PEEK_PX + 1))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Pas de bouton si le contenu tient dans l'aperçu : on force « ouvert ».
  const effectivementOuvert = ouvert || !depasse

  return (
    <Collapsible open={effectivementOuvert} onOpenChange={setOuvert}>
      {/* `forceMount` garde le contenu monté → Radix calcule
          --radix-collapsible-content-height, qu'on anime via height. */}
      <CollapsiblePrimitive.Content
        forceMount
        className="h-[var(--radix-collapsible-content-height)] overflow-hidden transition-[height] duration-200 ease-out data-[state=closed]:h-[4.5rem]"
      >
        <div ref={contenuRef}>
          <RenduContenuHtml html={html} className="text-sm leading-relaxed text-text" />
        </div>
      </CollapsiblePrimitive.Content>
      {depasse && (
        <CollapsibleTrigger className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronDown className={clsxm('size-4 transition-transform', ouvert && 'rotate-180')} />
          {ouvert ? 'Voir moins' : 'Voir plus'}
        </CollapsibleTrigger>
      )}
    </Collapsible>
  )
}
