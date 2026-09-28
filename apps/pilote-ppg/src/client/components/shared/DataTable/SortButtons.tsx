import { clsxm } from "@/utils/clsxm";
import type { AnyColumn } from "./types";

type Direction = "asc" | "desc";

function SortDirectionButton({
  direction,
  active,
  label,
  onClick,
  className,
}: {
  direction: Direction;
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      aria-pressed={active}
      className={clsxm(
        "inline-flex w-6 h-7 items-center justify-center rounded border border-white bg-dsfr-blue-france-925 hover:bg-dsfr-blue-france-925-hover",
        active && "bg-primary hover:bg-dsfr-blue-france-sun-113-hover",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <span className="sr-only">{label}</span>
      <svg
        aria-hidden="true"
        className={active ? "text-white" : "text-primary"}
        fill="currentColor"
        height="6"
        viewBox="0 0 12 6"
        width="12"
      >
        <path
          clipRule="evenodd"
          d={direction === "asc" ? "M6 0L12 6H0L6 0Z" : "M6 6L0 0H12L6 6Z"}
          fillRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function SortButtons({
  column,
  label,
}: {
  column: AnyColumn;
  label: string;
}) {
  const sorted = column.getIsSorted();
  const toggle = (direction: Direction) =>
    sorted === direction
      ? column.clearSorting()
      : column.toggleSorting(direction === "desc");

  return (
    <span className="inline-flex items-center min-[576px]:flex-row min-[576px]:items-start">
      <SortDirectionButton
        active={sorted === "asc"}
        className="mr-1"
        direction="asc"
        label={`Trier par ${label}, ordre croissant`}
        onClick={() => toggle("asc")}
      />
      <SortDirectionButton
        active={sorted === "desc"}
        direction="desc"
        label={`Trier par ${label}, ordre décroissant`}
        onClick={() => toggle("desc")}
      />
    </span>
  );
}
