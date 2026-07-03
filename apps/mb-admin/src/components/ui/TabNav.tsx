import { clsxm } from '@/lib/clsxm'

export type TabNavItem = { key: string; label: string }

export function TabNav({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabNavItem[]
  active: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={clsxm('mb-6 flex gap-1 border-b border-border', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={clsxm(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
