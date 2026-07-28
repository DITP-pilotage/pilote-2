import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, Ref } from 'react'

import { clsxm } from './clsxm'

const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-md',
    'transition-colors duration-150',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
  ],
  {
    variants: {
      variant: {
        ghost: 'text-text-subtle hover:bg-tertiary-hover hover:text-primary',
        danger: 'text-text-subtle hover:bg-red-marianne-tinted hover:text-red-marianne',
      },
      size: {
        sm: 'size-7 [&_svg]:size-3.5',
        md: 'size-9 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
)

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants> & {
    // Bouton sans texte visible : le libellé accessible est obligatoire. Il sert
    // aussi d'infobulle native, en attendant un vrai composant Tooltip.
    label: string
    asChild?: boolean
    ref?: Ref<HTMLButtonElement>
  }

export function IconButton({
  className,
  variant,
  size,
  label,
  asChild = false,
  type,
  ref,
  ...props
}: IconButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'
  return (
    <Comp
      ref={ref}
      // Un bouton d'icône est une action, jamais un submit implicite. `asChild`
      // rend un élément arbitraire (lien…) : on ne lui impose pas de `type`.
      type={asChild ? type : (type ?? 'button')}
      aria-label={label}
      title={label}
      className={clsxm(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
