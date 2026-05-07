import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId } from 'react'

import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { clsxm } from '@/lib/clsxm'

export const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100] as const

export interface PaginationProps {
  hasPrevious?: boolean
  hasNext?: boolean
  onPrevious?: () => void
  onNext?: () => void
  pageSize?: number
  pageSizeOptions?: ReadonlyArray<number>
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

export function Pagination({
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const pageSizeId = useId()
  const showPageSize = pageSize !== undefined && onPageSizeChange !== undefined
  return (
    <nav
      aria-label="Pagination"
      className={clsxm('flex items-center justify-between gap-2', className)}
    >
      {showPageSize ? (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <label htmlFor={pageSizeId}>Items par page</label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger id={pageSizeId} className="py-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={!hasPrevious}
          onClick={onPrevious}
        >
          <ChevronLeft />
          Page précédente
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={!hasNext}
          onClick={onNext}
        >
          Page suivante
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
