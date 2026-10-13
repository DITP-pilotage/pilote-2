import { FunctionComponent } from "react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formaterDate } from "@/client/utils/date/date";

interface TableauRéformesAvancementProps {
  avancement: number | null;
  dateDeMàjDonnéesQuantitatives?: string | null;
  estArchive?: boolean;
}

const TableauRéformesAvancement: FunctionComponent<
  TableauRéformesAvancementProps
> = ({ avancement, dateDeMàjDonnéesQuantitatives, estArchive }) => {
  const typeDeRéforme = "chantier";

  return (
    <div className="grid grid-rows-[2rem_0.75rem] items-center text-[10px] w-full">
      {avancement === null ? (
        <span className="text-dsfr-mention-grey fr-text--xs">
          Non renseigné
        </span>
      ) : (
        <ProgressBar
          background="white"
          size="sm"
          value={avancement}
          variant={
            typeDeRéforme === "chantier"
              ? estArchive
                ? "secondary"
                : "primary"
              : "pink"
          }
        />
      )}
      {!!dateDeMàjDonnéesQuantitatives && (
        <span className="text-dsfr-mention-grey">
          ({formaterDate(dateDeMàjDonnéesQuantitatives, "MM/YYYY")})
        </span>
      )}
    </div>
  );
};

export default TableauRéformesAvancement;
