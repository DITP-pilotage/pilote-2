import { DropdownMenu } from 'radix-ui'
import type { MeApiModel } from '@pilote/kpilote-shared/me'
import { ChevronDown, CircleUserRound, LogOut } from 'lucide-react'

import { Button } from '@pilote/kpilote-ui/Button'

type UserMenuProps = {
  user: Pick<MeApiModel, 'prenom' | 'nom'>
  onLogout: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-tinted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=open]:bg-surface-tinted"
        >
          <CircleUserRound className="size-5" aria-hidden />
          Mon espace
          <ChevronDown
            className="size-4 transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-40 min-w-[16rem] rounded-xl border border-border bg-surface p-2 shadow-[0_20px_40px_rgba(0,0,145,0.12)]"
        >
          <div className="px-3 py-2.5">
            <p className="text-sm font-bold text-text">
              {user.prenom} {user.nom}
            </p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <div className="p-1">
            <DropdownMenu.Item asChild>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="w-full justify-center"
                onClick={onLogout}
              >
                <LogOut /> Se déconnecter
              </Button>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
