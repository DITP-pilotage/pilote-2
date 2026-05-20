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
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs rounded-md border border-secondary-border bg-surface px-3 py-1.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </>
  )
}
