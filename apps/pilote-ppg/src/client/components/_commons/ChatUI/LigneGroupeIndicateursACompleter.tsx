import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";

// Classes littérales (Tailwind en `important` : un style en ligne ne passerait pas).
const RETRAIT_PAR_PROFONDEUR = ["pl-2 md:pl-2", "pl-7 md:pl-7"];

/** Une ligne de groupe sur toute la largeur : son libellé et ses effectifs, qui la déplient. */
export const LigneGroupeIndicateursACompleter = ({
  libelle,
  details,
  profondeur,
  premierNiveau,
  nombreColonnes,
  deplie,
  onBasculer,
  className,
}: {
  libelle: string;
  details: string[];
  profondeur: number;
  premierNiveau: boolean;
  nombreColonnes: number;
  deplie: boolean;
  onBasculer: () => void;
  className?: string;
}) => (
  <Table.Row>
    <Table.Cell
      className={clsxm(
        className,
        "border-t",
        premierNiveau
          ? "border-dsfr-blue-france-925 bg-dsfr-blue-france-950"
          : "border-dsfr-grey-925",
        RETRAIT_PAR_PROFONDEUR[profondeur],
      )}
      colSpan={nombreColonnes}
    >
      <button
        aria-expanded={deplie}
        className="box-border flex w-full items-baseline gap-2 p-0 text-left"
        onClick={onBasculer}
        type="button"
      >
        <Icone
          className={clsxm(
            "h-4 w-4 shrink-0 self-center text-dsfr-blue-france-sun-113 transition-transform motion-reduce:transition-none",
            !deplie && "-rotate-90",
          )}
          icone={ArrowSLine2Icon}
        />
        <span
          className={clsxm(
            "min-w-0 flex-1 truncate",
            premierNiveau ? "font-bold" : "font-medium",
          )}
          title={libelle}
        >
          {libelle}
        </span>{" "}
        <span className="sr-only">·</span>{" "}
        <span className="shrink-0 whitespace-nowrap text-xs text-dsfr-mention-grey">
          {details.join(" · ")}
        </span>
      </button>
    </Table.Cell>
  </Table.Row>
);
