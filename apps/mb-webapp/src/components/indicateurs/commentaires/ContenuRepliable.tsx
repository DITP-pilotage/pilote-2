import { ChevronDown } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'

import { RenduContenuHtml } from '@/components/editeur-riche/RenduContenuHtml'
import { clsxm } from '@/lib/clsxm'

export function ContenuRepliable({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [deplie, setDeplie] = useState(false)
  const [depasse, setDepasse] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setDepasse(el.scrollHeight > el.clientHeight + 1)
  }, [html])

  return (
    <div>
      <RenduContenuHtml
        ref={ref}
        html={html}
        className={clsxm('text-sm leading-relaxed text-text', !deplie && 'line-clamp-3')}
      />
      {(depasse || deplie) && (
        <button
          type="button"
          onClick={() => setDeplie((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ChevronDown className={clsxm('size-4 transition-transform', deplie && 'rotate-180')} />
          {deplie ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  )
}
