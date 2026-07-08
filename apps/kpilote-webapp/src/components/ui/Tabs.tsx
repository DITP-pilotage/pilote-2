import { Tabs as TabsPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={clsxm('flex gap-1 border-b border-border', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={clsxm(
        '-mb-px inline-flex items-center border-b-2 border-transparent px-4 py-3 text-sm font-medium text-text-muted transition-colors',
        'hover:text-text',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:rounded-sm',
        'data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={clsxm('pt-8 focus-visible:outline-none', className)}
      {...props}
    />
  )
}
