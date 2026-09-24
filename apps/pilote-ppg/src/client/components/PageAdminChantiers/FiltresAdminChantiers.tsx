import type { Table } from "@tanstack/react-table";
import type { FeaturesTableauAdmin } from "@/components/_commons/TableauAdmin/featuresTableauAdmin";
import { $Enums } from "@prisma/client";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { GroupeCasesACocher } from "@/components/_commons/GroupeCasesACocher/GroupeCasesACocher";
import { FiltresTableauAdmin } from "@/components/_commons/TableauAdmin/FiltresTableauAdmin";
import { useFiltreColonne } from "@/components/_commons/TableauAdmin/useEtatTableauAdmin";
import type { Perimetre } from "@/server/metadataChantier/queries/ListerPerimetresQuery";
import { ChantierAdminRow, STATUT_BADGE } from "./useTableauAdminChantiers";

const OPTIONS_STATUT = Object.values($Enums.type_statut).map((statut) => ({
  valeur: statut,
  label: STATUT_BADGE[statut].label,
}));

export const FiltresAdminChantiers = ({
  table,
  perimetres,
  aDesFiltresActifs,
  reinitialiserLesFiltres,
}: {
  table: Table<FeaturesTableauAdmin, ChantierAdminRow>;
  perimetres: Perimetre[];
  aDesFiltresActifs: boolean;
  reinitialiserLesFiltres: () => void;
}) => {
  const [valeursStatut, setValeursStatut] = useFiltreColonne(table, "chState");
  const [valeursPerimetre, setValeursPerimetre] = useFiltreColonne(
    table,
    "perimetreId",
  );

  return (
    <FiltresTableauAdmin
      aDesFiltresActifs={aDesFiltresActifs}
      reinitialiserLesFiltres={reinitialiserLesFiltres}
      table={table}
    >
      <GroupeCasesACocher
        label="Statut :"
        onChange={setValeursStatut}
        options={OPTIONS_STATUT}
        values={valeursStatut}
      />

      <MultiSelectFiltre
        className="max-w-fit"
        classNameBouton="min-w-[20rem]"
        getOptionLabel={(value) =>
          perimetres.find((perimetre) => perimetre.id === value)?.nom ?? value
        }
        label="Périmètre"
        onChange={setValeursPerimetre}
        optionGroups={[
          {
            label: "",
            options: perimetres.map((perimetre) => perimetre.id),
          },
        ]}
        showGroupSelection={false}
        values={valeursPerimetre}
      />
    </FiltresTableauAdmin>
  );
};
