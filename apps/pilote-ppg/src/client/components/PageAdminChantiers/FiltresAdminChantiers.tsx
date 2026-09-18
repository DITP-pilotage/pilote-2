import { Table } from "@tanstack/react-table";
import { useId, useMemo } from "react";
import { $Enums } from "@prisma/client";
import { Checkbox } from "@/components/shared/Checkbox";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ChantierAdminRow, STATUT_BADGE } from "./useTableauAdminChantiers";

const STATUTS = Object.values($Enums.type_statut);

export const FiltresAdminChantiers = ({
  table,
  chantiers,
}: {
  table: Table<ChantierAdminRow>;
  chantiers: ChantierAdminRow[];
}) => {
  const id = useId();
  const colonneStatut = table.getColumn("chState");
  const colonnePerimetre = table.getColumn("perimetreId");

  const valeursStatut = (colonneStatut?.getFilterValue() as string[]) ?? [];
  const valeursPerimetre =
    (colonnePerimetre?.getFilterValue() as string[]) ?? [];

  const nomsPerimetres = useMemo(() => {
    const noms = new Map<string, string>();
    chantiers.forEach((chantier) => {
      noms.set(chantier.perimetreId, chantier.perimetreNom);
    });
    return noms;
  }, [chantiers]);

  const idsPerimetresDisponibles = colonnePerimetre
    ? [...colonnePerimetre.getFacetedUniqueValues().keys()]
    : [];

  const aDesFiltresActifs =
    valeursStatut.length > 0 || valeursPerimetre.length > 0;

  return (
    <section className="flex flex-wrap items-center gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold whitespace-nowrap">Statut :</span>
        <div className="flex flex-wrap items-center gap-2">
          {STATUTS.map((statut) => {
            const optionId = `${id}-${statut}`;
            const estCoché = valeursStatut.includes(statut);
            return (
              <label
                className="flex items-center gap-2 cursor-pointer"
                htmlFor={optionId}
                key={statut}
              >
                <Checkbox
                  checked={estCoché}
                  id={optionId}
                  onCheckedChange={() =>
                    colonneStatut?.setFilterValue(
                      estCoché
                        ? valeursStatut.filter((valeur) => valeur !== statut)
                        : [...valeursStatut, statut],
                    )
                  }
                />
                {STATUT_BADGE[statut].label}
              </label>
            );
          })}
        </div>
      </div>

      <MultiSelectFiltre
        getOptionLabel={(value) => nomsPerimetres.get(value) ?? value}
        label="Périmètre"
        onChange={(nouvellesValeurs) =>
          colonnePerimetre?.setFilterValue(nouvellesValeurs)
        }
        optionGroups={[
          { label: "Périmètres", options: idsPerimetresDisponibles },
        ]}
        values={valeursPerimetre}
      />

      {aDesFiltresActifs && (
        <Bouton
          label="Réinitialiser les filtres"
          onClick={() => table.resetColumnFilters()}
          size="sm"
          variant="link"
        />
      )}
    </section>
  );
};
