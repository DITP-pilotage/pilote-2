import { ChevronDown } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'

import { RenduContenuHtml } from '@/components/editeur-riche/RenduContenuHtml'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { clsxm } from '@/lib/clsxm'

// Hauteur de l'aperçu replié (~3 lignes).
const PEEK = '4.5rem'

export function ContenuRepliable({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ouvert, setOuvert] = useState(false)
  const [depasse, setDepasse] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setDepasse(el.scrollHeight > el.clientHeight + 1)
  }, [html])

  return (
    <Collapsible open={ouvert} onOpenChange={setOuvert}>
      <CollapsibleContent ref={ref} peek={PEEK}>
        <RenduContenuHtml html={html} className="text-sm leading-relaxed text-text" />
      </CollapsibleContent>
      {(depasse || ouvert) && (
        <CollapsibleTrigger className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronDown className={clsxm('size-4 transition-transform', ouvert && 'rotate-180')} />
          {ouvert ? 'Voir moins' : 'Voir plus'}
        </CollapsibleTrigger>
      )}
    </Collapsible>
  )
}
