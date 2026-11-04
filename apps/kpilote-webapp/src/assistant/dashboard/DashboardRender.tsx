import { widgetWidth, type DashboardOutput } from '@pilote/kpilote-shared/assistant/dashboard'
import { TriangleAlert } from 'lucide-react'
import { Component, Suspense, type ReactNode } from 'react'

import { dashboardElementAttribute } from './dashboardParts'
import { DashboardWidgetView } from './widgets'

const WIDTH_CLASSES: Record<number, string> = {
  1: 'col-span-4 md:col-span-1',
  2: 'col-span-4 md:col-span-2',
  3: 'col-span-4 md:col-span-3',
  4: 'col-span-4',
}

/** Une erreur de widget (droits, donnée absente) reste dans son cadre : le reste s'affiche. */
class WidgetErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex h-full items-center gap-2 rounded-lg border border-error p-4 text-sm text-text">
        <TriangleAlert className="size-4 text-error" />
        Ce widget n&apos;a pas pu être affiché.
      </div>
    )
  }
}

export function DashboardLoader() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <p className="m-0 text-sm text-text-subtle">Composition du tableau de bord…</p>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 h-24 animate-pulse rounded-lg bg-surface-tinted" />
        <div className="col-span-3 h-24 animate-pulse rounded-lg bg-surface-tinted" />
        <div className="col-span-4 h-40 animate-pulse rounded-lg bg-surface-tinted" />
      </div>
    </div>
  )
}

/** Le dashboard composé par l'assistant : chaque widget lit ses propres données. */
export function DashboardRender({
  dashboard,
  toolCallId,
}: {
  dashboard: DashboardOutput
  toolCallId: string
}) {
  return (
    <article
      className="overflow-hidden rounded-lg border border-border bg-surface"
      {...dashboardElementAttribute(toolCallId)}
    >
      <header className="border-b border-border bg-surface-muted px-4 py-3">
        <h3 className="m-0 text-base font-bold text-text">{dashboard.titre}</h3>
      </header>
      <div className="flex flex-col gap-3 p-4">
        {dashboard.containers.map((container, containerIndex) => (
          <div key={containerIndex} className="grid grid-cols-4 gap-3">
            {container.widgets.map((widget, widgetIndex) => (
              <div key={widgetIndex} className={`min-w-0 ${WIDTH_CLASSES[widgetWidth(widget)]}`}>
                <WidgetErrorBoundary>
                  <Suspense
                    fallback={<div className="h-24 animate-pulse rounded-lg bg-surface-tinted" />}
                  >
                    <DashboardWidgetView widget={widget} labels={dashboard.labels} />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            ))}
          </div>
        ))}
      </div>
    </article>
  )
}
