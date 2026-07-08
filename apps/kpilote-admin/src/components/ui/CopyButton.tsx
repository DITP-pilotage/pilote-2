import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'

export function CopyButton({
  value,
  label = 'Copier',
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => setCopied(false))
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={clsxm('text-primary', className)}
      aria-label={label}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  )
}
