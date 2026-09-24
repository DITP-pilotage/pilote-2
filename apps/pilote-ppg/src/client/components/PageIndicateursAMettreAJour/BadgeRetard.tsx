import { clsxm } from "@/utils/clsxm";
import {
  CLASSES_TONALITE_RETARD,
  libelleRetard,
  tonaliteRetard,
} from "./retard";

export const BadgeRetard = ({
  retardJours,
}: {
  retardJours: number | null;
}) => (
  <span
    className={clsxm(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
      CLASSES_TONALITE_RETARD[tonaliteRetard(retardJours)].pastille,
    )}
  >
    {libelleRetard(retardJours)}
  </span>
);
