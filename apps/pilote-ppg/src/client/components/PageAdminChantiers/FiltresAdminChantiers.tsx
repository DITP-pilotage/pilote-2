import { Table } from "@tanstack/react-table";
import { useId, useMemo } from "react";
import { $Enums } from "@prisma/client";
import { Checkbox } from "@/components/shared/Checkbox";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { ChantierAdminRow, STATUT_BADGE } from "./useTableauAdminChantiers";

const STATUTS = Object.values($Enums.type_statut);

const OptionStatut = ({
  statut,
  estCoché,
  onToggle,
}: {
  statut: $Enums.type_statut;
  estCoché: boolean;
  onToggle: () => void;
}) => {
  const id = useId();
  return (
    <label className="flex items-center gap-2 cursor-pointer" htmlFor={id}>
      <Checkbox checked={estCoché} id={id} onCheckedChange={onToggle} />
      {STATUT_BADGE[statut].label}
    </label>
  );
};

export const FiltresAdminChantiers = ({
  table,
  chantiers,
  aDesFiltresActifs,
  reinitialiserLesFiltres,
}: {
  table: Table<ChantierAdminRow>;
  chantiers: ChantierAdminRow[];
  aDesFiltresActifs: boolean;
  reinitialiserLesFiltres: () => void;
}) => {
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

  return (
    <section className="flex flex-col gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div className="w-full max-w-sm">
        <BarreDeRecherche
          changementDeLaRechercheCallback={(event) =>
            table.setGlobalFilter(event.target.value)
          }
          valeur={(table.getState().globalFilter as string | undefined) ?? ""}
        />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold whitespace-nowrap">Statut :</span>
        <div className="flex flex-wrap items-center gap-2">
          {STATUTS.map((statut) => {
            const estCoché = valeursStatut.includes(statut);
            return (
              <OptionStatut
                estCoché={estCoché}
                key={statut}
                onToggle={() =>
                  colonneStatut?.setFilterValue(
                    estCoché
                      ? valeursStatut.filter((valeur) => valeur !== statut)
                      : [...valeursStatut, statut],
                  )
                }
                statut={statut}
              />
            );
          })}
        </div>
      </div>

      <MultiSelectFiltre
        className="max-w-fit"
        classNameBouton="min-w-[20rem]"
        getOptionLabel={(value) => nomsPerimetres.get(value) ?? value}
        label="Périmètre"
        onChange={(nouvellesValeurs) =>
          colonnePerimetre?.setFilterValue(nouvellesValeurs)
        }
        optionGroups={[{ label: "", options: idsPerimetresDisponibles }]}
        showGroupSelection={false}
        values={valeursPerimetre}
      />

      {aDesFiltresActifs && (
        <Bouton
          className="pl-0"
          iconLeft={
            <Icone
              className="w-4 h-4 mt-1 rotate-y-180"
              icone={ArrowGoBackIcon}
            />
          }
          label="Réinitialiser les filtres"
          onClick={reinitialiserLesFiltres}
          size="sm"
          variant="link"
        />
      )}
    </section>
  );
};
