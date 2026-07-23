import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../Collapsible'
import { clsxm } from '../clsxm'

export function Accordeon({
  titre,
  children,
  defaultOpen = false,
  className,
}: {
  titre: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [ouvert, setOuvert] = useState(defaultOpen)
  return (
    <Collapsible
      open={ouvert}
      onOpenChange={setOuvert}
      className={clsxm('overflow-hidden rounded-md border border-border', className)}
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 bg-surface-tinted p-4 text-left text-base font-medium transition-colors hover:bg-surface-tinted-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {titre}
        <ChevronDown className="size-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-3 text-sm leading-relaxed [&_p]:mb-0">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
