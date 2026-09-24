import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import { useTableauIndicateursNonAJour } from "./useTableauIndicateursNonAJour";
import { FiltresIndicateurs } from "./FiltresIndicateurs";
import { CarteChantier } from "./CarteChantier";

const TableauIndicateursNonAJour = ({
  indicateurs,
}: {
  indicateurs: IndicateurNonAJour[];
}) => {
  const { tableau, ...filtres } = useTableauIndicateursNonAJour(indicateurs);
  const groupes = tableau.getRowModel().rows;

  return (
    <div className="flex flex-col gap-5">
      <FiltresIndicateurs {...filtres} />
      {groupes.length === 0 ? (
        <p className="fr-text--sm text-dsfr-mention-grey">
          Aucun indicateur ne correspond à vos filtres.
        </p>
      ) : (
        groupes.map((groupe) => (
          <CarteChantier groupe={groupe} key={groupe.id} />
        ))
      )}
    </div>
  );
};

export default TableauIndicateursNonAJour;
