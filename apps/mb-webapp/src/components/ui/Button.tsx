import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, Ref } from 'react'

import { clsxm } from '@/lib/clsxm'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded font-medium',
    'transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:bg-disabled disabled:text-disabled-foreground disabled:border-disabled disabled:cursor-not-allowed disabled:hover:bg-disabled',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary:
          'bg-secondary text-secondary-foreground border border-secondary-border hover:bg-secondary-hover',
        tertiary: 'text-tertiary-foreground hover:bg-tertiary-hover',
      },
      size: {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    ref?: Ref<HTMLButtonElement>
  }

export function Button({ className, variant, size, asChild = false, ref, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp ref={ref} className={clsxm(buttonVariants({ variant, size }), className)} {...props} />
  )
}
