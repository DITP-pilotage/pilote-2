import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List className={clsxm('flex border-b border-border', className)} {...props} />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={clsxm(
        '-mb-px inline-flex items-center border-b-2 border-transparent px-4 py-2 text-sm text-text-muted transition-colors',
        'hover:text-text',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'data-[state=active]:border-primary data-[state=active]:text-text data-[state=active]:font-medium',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={clsxm('pt-4 focus-visible:outline-none', className)}
      {...props}
    />
  )
}
