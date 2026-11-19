import { useCallback, useState } from "react";
import { api } from "@/server/framework/trpc/api";
import { Button } from "@/components/shared/Button";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import type { PeriodeInformation } from "@/server/formations/queries/ListPeriodesInformationQuery";
import { ModalePeriodeInformation } from "./ModalePeriodeInformation";
import { ModaleSuppressionPeriode } from "./ModaleSuppressionPeriode";
import { useTableauPeriodesInformation } from "./useTableauPeriodesInformation";

const LIBELLES = {
  aucun: "Aucune période d'information pour l'instant.",
  aucunResultat: "Aucune période ne correspond à",
};

type Edition = { periode: PeriodeInformation | null } | null;

export const PeriodesInformation = () => {
  const { data: donnees, isLoading } =
    api.formation.periodesInformation.useQuery();
  const [edition, setEdition] = useState<Edition>(null);
  const [suppression, setSuppression] = useState<PeriodeInformation | null>(
    null,
  );
  const modifier = useCallback(
    (periode: PeriodeInformation) => setEdition({ periode }),
    [],
  );
  const table = useTableauPeriodesInformation({
    periodes: donnees?.periodes ?? [],
    modifier,
    supprimer: setSuppression,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => setEdition({ periode: null })} variant="primary">
          + Ajouter une période
        </Button>
      </div>
      <TableauAdmin
        caption="Périodes d'information"
        isLoading={isLoading}
        libelles={LIBELLES}
        table={table}
      />
      {edition && donnees ? (
        <ModalePeriodeInformation
          donnees={donnees}
          onClose={() => setEdition(null)}
          periode={edition.periode}
        />
      ) : null}
      {suppression ? (
        <ModaleSuppressionPeriode
          onClose={() => setSuppression(null)}
          periode={suppression}
        />
      ) : null}
    </div>
  );
};
