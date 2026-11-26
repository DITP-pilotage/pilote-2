import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type AnalyticsSource } from '@pilote/kpilote-shared/analytics/events'
import { MoreVertical, Pin, PinOff } from 'lucide-react'

import { usePinIndicateur, useUnpinIndicateur } from '@/mutations/epingles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@pilote/kpilote-ui/DropdownMenu'

export function IndicateurPinMenu({
  indicateur,
  isPinned,
  source,
  onUnpinned,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom'>
  isPinned: boolean
  source: AnalyticsSource
  // Appelé une fois l'épingle retirée, par exemple pour replacer le focus
  // quand la carte quitte la section des épinglés.
  onUnpinned?: () => void
}) {
  const pin = usePinIndicateur()
  const unpin = useUnpinIndicateur()
  const variables = { indicateurId: indicateur.id, source }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions sur l’indicateur ${indicateur.nom}`}
        className="flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-tinted hover:text-primary data-[state=open]:bg-surface-tinted"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {isPinned ? (
          <DropdownMenuItem
            disabled={unpin.isPending}
            onSelect={() => unpin.mutate(variables, { onSuccess: () => onUnpinned?.() })}
          >
            <PinOff />
            Désépingler
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={pin.isPending} onSelect={() => pin.mutate(variables)}>
            <Pin />
            Épingler
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
