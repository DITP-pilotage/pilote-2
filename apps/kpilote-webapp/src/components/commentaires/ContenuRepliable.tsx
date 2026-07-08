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
  // Hauteur réelle du contenu, mesurée sur le `div` interne non contraint.
  // `null` tant qu'on n'a pas mesuré.
  const [hauteur, setHauteur] = useState<number | null>(null)

  useEffect(() => {
    const el = contenuRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setHauteur(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Avant la première mesure on suppose que le contenu dépasse (aperçu replié,
  // pas de flash) ; la mesure ajuste ensuite si le contenu est court.
  const depasse = hauteur === null ? true : hauteur > PEEK_PX + 1
  // Pas de bouton si le contenu tient dans l'aperçu : on force « ouvert ».
  const effectivementOuvert = ouvert || !depasse

  return (
    <Collapsible open={effectivementOuvert} onOpenChange={setOuvert}>
      {/* On anime la hauteur de CE wrapper externe (aperçu ↔ hauteur réelle
          mesurée), que Radix ne mesure pas : son layout effect appelle
          getBoundingClientRect() sur le `Content` en remettant la transition à
          0s, ce qui « snapperait » toute animation portée par le `Content`
          lui-même. On pilote la hauteur via notre propre mesure plutôt que
          --radix-collapsible-content-height (bloquée à l'aperçu, car Radix
          mesure l'élément contraint). */}
      <div
        className="overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: effectivementOuvert ? (hauteur ?? PEEK_PX) : PEEK_PX }}
      >
        {/* `forceMount` : Radix ne rend ses enfants qu'à l'ouverture ; on les
            garde montés pour afficher l'aperçu. Le `Content` reste à sa hauteur
            naturelle et sert au câblage a11y (aria-controls du Trigger). */}
        <CollapsiblePrimitive.Content forceMount>
          <div ref={contenuRef}>
            <RenduContenuHtml html={html} className="text-sm leading-relaxed text-text" />
          </div>
        </CollapsiblePrimitive.Content>
      </div>
      {depasse && (
        <CollapsibleTrigger className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronDown className={clsxm('size-4 transition-transform', ouvert && 'rotate-180')} />
          {ouvert ? 'Voir moins' : 'Voir plus'}
        </CollapsibleTrigger>
      )}
    </Collapsible>
  )
}
