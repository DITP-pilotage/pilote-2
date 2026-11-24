import { useMemo, useState } from "react";
import { api } from "@/server/framework/trpc/api";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { ANALYTICS_DIMENSIONS } from "@/shared/analytics/dimensions";
import { ModaleDimension } from "./ModaleDimension";
import {
  type DimensionRow,
  useTableauDimensions,
} from "./useTableauDimensions";

const LIBELLES = {
  aucun: "Aucune dimension.",
  aucunResultat: "Aucune dimension ne correspond à",
};

export const DimensionsMatomoPanel = () => {
  const {
    data: slots,
    isLoading,
    isError,
  } = api.analytics.dimensionSlots.useQuery();
  const [edited, setEdited] = useState<DimensionRow | null>(null);
  const rows = useMemo<DimensionRow[]>(
    () =>
      slots
        ? ANALYTICS_DIMENSIONS.map((dimension) => ({
            dimension,
            slot: slots[dimension] ?? null,
          }))
        : [],
    [slots],
  );
  const table = useTableauDimensions({ rows, edit: setEdited });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-bold text-dsfr-blue-france-sun-113 mb-1">
          Dimensions Matomo
        </h2>
        <p className="text-sm text-dsfr-mention-grey">
          Créez d&apos;abord la dimension dans Matomo, en portée « Action » si
          sa valeur change d&apos;une page à l&apos;autre, puis reportez ici son
          numéro. Pour échanger deux numéros, retirez d&apos;abord l&apos;un des
          deux. Une modification s&apos;applique au prochain chargement complet
          de la page. Changer un numéro existant rompt la continuité des
          rapports Matomo.
        </p>
      </div>
      {isError ? (
        <p className="text-sm text-dsfr-error-425" role="alert">
          Les dimensions n&apos;ont pas pu être chargées. Rechargez la page.
        </p>
      ) : (
        <TableauAdmin
          caption="Dimensions Matomo"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      )}
      {edited ? (
        <ModaleDimension onClose={() => setEdited(null)} row={edited} />
      ) : null}
    </div>
  );
};
