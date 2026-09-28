import Link from "next/link";
import { type ReactNode, useId } from "react";
import { clsxm } from "@/utils/clsxm";
import type { AnyRow } from "./config";
import type { AnyTable } from "./types";

export function DataTableTileList({
  table,
  caption,
  tile,
  getRowHref,
  tileLabel,
  tileClassName,
}: {
  table: AnyTable;
  caption: ReactNode;
  tile: (row: AnyRow) => ReactNode;
  getRowHref?: (row: AnyRow) => string | undefined;
  tileLabel?: (row: AnyRow) => string;
  tileClassName?: (row: AnyRow) => string | undefined;
}) {
  const captionId = useId();
  return (
    <>
      <p className="sr-only" id={captionId}>
        {caption}
      </p>
      <ul aria-labelledby={captionId} className="flex flex-col">
        {table.getRowModel().rows.map((row: AnyRow) => {
          const href = row.getIsGrouped?.() ? undefined : getRowHref?.(row);
          return (
            <li className={clsxm(tileClassName?.(row))} key={row.id}>
              {href ? (
                <Link
                  aria-label={tileLabel?.(row)}
                  className="block no-underline bg-none"
                  href={href}
                >
                  {tile(row)}
                </Link>
              ) : (
                tile(row)
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
