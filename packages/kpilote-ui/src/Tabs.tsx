import { Tabs as TabsPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { clsxm } from './clsxm'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={clsxm('relative z-10 flex flex-wrap items-end gap-1', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={clsxm(
        // Onglet DSFR : bouton « collection » bordé. Le -mb-px fait chevaucher la
        // bordure du panneau pour connecter l'onglet actif.
        '-mb-px inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-base font-bold transition-colors',
        'border border-border border-t-2 border-t-transparent',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        // Inactif : fond bleu clair (bleu France « low »), texte foncé.
        'bg-primary-tinted text-text hover:bg-primary/10',
        // Actif : fond de la surface, texte + trait haut bleu marianne, bordure
        // basse masquée pour se fondre dans le panneau de contenu.
        'data-[state=active]:border-t-primary data-[state=active]:border-b-surface data-[state=active]:bg-surface data-[state=active]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={clsxm('border border-border bg-surface p-6 focus-visible:outline-none', className)}
      {...props}
    />
  )
}
