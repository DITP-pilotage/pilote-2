import { Check } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { Fragment } from 'react'

import { useAssistantDisplay } from './AssistantProvider'
import { ViewPictogram } from './ViewPictogram'
import { ASSISTANT_VIEWS, type AssistantView } from './views'

const LABELS: Record<AssistantView, string> = {
  sidePanel: 'Panneau latéral',
  floating: 'Fenêtre flottante',
  fullscreen: 'Plein écran',
}

const ORDER: readonly AssistantView[] = ['sidePanel', 'floating', 'fullscreen']

const isView = (value: string): value is AssistantView =>
  (ASSISTANT_VIEWS as readonly string[]).includes(value)

export function MenuVue() {
  const { display, availableViews, changeView } = useAssistantDisplay()

  if (availableViews.length < 2 || !isView(display)) return null
  const views = ORDER.filter((view) => availableViews.includes(view))

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label={`Affichage : ${LABELS[display]}`}
        title="Affichage"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary-tinted data-[state=open]:bg-primary-tinted"
      >
        <ViewPictogram view={display} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-56 rounded-lg border border-border bg-surface p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <DropdownMenu.RadioGroup
            value={display}
            onValueChange={(value) => {
              if (isView(value) && value !== display) changeView(value)
            }}
          >
            {views.map((view) => (
              <Fragment key={view}>
                {view === 'fullscreen' && views.length > 1 ? (
                  <DropdownMenu.Separator className="my-1.5 h-px bg-border" />
                ) : null}
                <DropdownMenu.RadioItem
                  value={view}
                  className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm text-text outline-none data-[highlighted]:bg-surface-tinted data-[state=checked]:font-medium"
                >
                  <ViewPictogram view={view} className="text-primary" />
                  <span className="flex-1">{LABELS[view]}</span>
                  <DropdownMenu.ItemIndicator>
                    <Check className="size-4 text-primary" />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              </Fragment>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
