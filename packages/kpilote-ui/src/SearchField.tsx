import { Search } from 'lucide-react'
import { useId } from 'react'

type SearchFieldProps = {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function SearchField({ label, placeholder, value, onChange }: SearchFieldProps) {
  const id = useId()
  return (
    <div className="relative w-full max-w-sm">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle"
      />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-subtle hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
    </div>
  )
}
