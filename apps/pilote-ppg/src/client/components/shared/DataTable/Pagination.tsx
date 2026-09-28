import type { PaginationState } from "@tanstack/react-table";
import { type ComponentType, useId } from "react";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLeftSFirstIcon } from "@/components/_commons/Icones/ArrowLeftSFirstIcon";
import { ArrowLeftSLastIcon } from "@/components/_commons/Icones/ArrowLeftSLastIcon";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { ArrowSLine3Icon } from "@/components/_commons/Icones/ArrowSLine3Icon";
import { clsxm } from "@/utils/clsxm";
import type { AnyTable } from "./types";

export const getPageItems = (
  currentPage: number,
  pageCount: number,
): Array<number | "ellipsis"> => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = new Set([
    1,
    pageCount,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  if (currentPage <= 3) [2, 3].forEach((page) => pages.add(page));
  if (currentPage >= pageCount - 2)
    [pageCount - 2, pageCount - 1].forEach((page) => pages.add(page));

  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);

  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    if (previous === undefined || page - previous === 1) return [page];
    if (page - previous === 2) return [previous + 1, page];
    return ["ellipsis" as const, page];
  });
};

const LINK =
  "inline-flex items-center justify-center min-h-8 min-w-8 px-3 py-1 mx-2 mb-4 rounded text-sm/6 text-dsfr-grey-50 hover:bg-dsfr-grey-1000 disabled:cursor-not-allowed disabled:text-dsfr-grey-625 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus";

const CURRENT =
  "cursor-default bg-primary text-dsfr-alt-blue-france hover:bg-dsfr-blue-france-sun-113-hover";

function EdgeButton({
  label,
  icon,
  iconPosition = "start",
  labelFromLg = false,
  disabled,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className: string; fill: string }>;
  iconPosition?: "start" | "end";
  labelFromLg?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const iconElement = (
    <Icone className="w-4 h-4 shrink-0 text-current" icone={icon} />
  );
  return (
    <button
      className={clsxm(
        LINK,
        "px-2",
        labelFromLg
          ? "min-[992px]:px-3 min-[992px]:gap-2"
          : "max-w-8 max-h-8 overflow-hidden",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {iconPosition === "start" && iconElement}
      <span
        className={labelFromLg ? "sr-only min-[992px]:not-sr-only" : "sr-only"}
      >
        {label}
      </span>
      {iconPosition === "end" && iconElement}
    </button>
  );
}

export type PaginationViewProps = {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
};

export function PaginationView({
  pageIndex,
  pageCount,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: PaginationViewProps) {
  const pageSizeId = useId();
  const hasPageSize = pageSizeOptions != null && onPageSizeChange != null;
  if (pageCount <= 1 && !hasPageSize) return null;

  const currentPage = pageIndex + 1;
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= pageCount;

  return (
    <div className={clsxm("flex flex-col items-center mt-11 mb-20", className)}>
      {pageCount > 1 && (
        <nav aria-label="Pagination du tableau">
          <ul className="flex flex-row flex-wrap items-center [&>li:first-child>*]:ml-0 [&>li:last-child>*]:mr-0">
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isFirst}
                icon={ArrowLeftSFirstIcon}
                label="Première page"
                onClick={() => onPageChange(0)}
              />
            </li>
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isFirst}
                icon={ArrowSLine3Icon}
                label="Page précédente"
                labelFromLg
                onClick={() => onPageChange(pageIndex - 1)}
              />
            </li>
            {getPageItems(currentPage, pageCount).map((item, index) =>
              item === "ellipsis" ? (
                <li key={`ellipsis-${index}`}>
                  <span className={LINK}>...</span>
                </li>
              ) : (
                <li key={item}>
                  <button
                    aria-current={item === currentPage ? "page" : undefined}
                    className={clsxm(LINK, item === currentPage && CURRENT)}
                    onClick={() => onPageChange(item - 1)}
                    type="button"
                  >
                    {item}
                  </button>
                </li>
              ),
            )}
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isLast}
                icon={ArrowSLine1Icon}
                iconPosition="end"
                label="Page suivante"
                labelFromLg
                onClick={() => onPageChange(pageIndex + 1)}
              />
            </li>
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isLast}
                icon={ArrowLeftSLastIcon}
                label="Dernière page"
                onClick={() => onPageChange(pageCount - 1)}
              />
            </li>
          </ul>
        </nav>
      )}
      {hasPageSize && (
        <div className="flex items-center gap-2 text-sm/6">
          <label htmlFor={pageSizeId}>Lignes par page</label>
          <select
            className="rounded-t border-b-2 border-dsfr-grey-200 bg-dsfr-contrast-grey px-3 py-1"
            id={pageSizeId}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export type DataTablePaginationProps = {
  pageSizeOptions?: number[];
  className?: string;
};

export function DataTablePagination({
  table,
  pageSizeOptions,
  className,
}: DataTablePaginationProps & { table: AnyTable }) {
  return (
    <table.Subscribe
      selector={(state: { pagination: PaginationState }) => state.pagination}
    >
      {(pagination: PaginationState) => (
        <PaginationView
          className={className}
          onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
          onPageSizeChange={
            pageSizeOptions
              ? (pageSize) => table.setPageSize(pageSize)
              : undefined
          }
          pageCount={table.getPageCount()}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </table.Subscribe>
  );
}
