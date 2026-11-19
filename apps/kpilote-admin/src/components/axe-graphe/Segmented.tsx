import { clsxm } from '@/lib/clsxm'

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
}) {
  return (
    <div className="inline-flex rounded-md bg-surface-muted p-0.5 text-xs font-semibold">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsxm(
            'rounded px-2.5 py-1',
            value === option.value ? 'bg-surface text-primary shadow-sm' : 'text-text-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
