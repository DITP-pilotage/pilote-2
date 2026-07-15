import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

function Root(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />
}

function Trigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />
}

function Portal(props: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props} />
}

function Overlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={clsxm('fixed inset-0 z-40 bg-black/40 backdrop-blur-sm', className)}
      {...props}
    />
  )
}

function Content({ className, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Content
      className={clsxm(
        'fixed left-1/2 top-[8vh] z-50 flex max-h-[84vh] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.22)] focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

function Title({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={clsxm('text-base font-semibold text-text', className)}
      {...props}
    />
  )
}

function Description({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={clsxm('mt-0.5 text-sm text-text-muted', className)}
      {...props}
    />
  )
}

function Close(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close {...props} />
}

export const Dialog = Object.assign(Root, {
  Trigger,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Close,
})
