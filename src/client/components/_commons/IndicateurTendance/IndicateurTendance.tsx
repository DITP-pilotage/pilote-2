import { Icone } from "@/components/_commons/Icone";
import { DecroissanceIcon } from "@/components/_commons/Icones/DecroissanceIcon";

export const IndicateurTendance = ({
  tendance,
}: {
  tendance: string | null;
}) => {
  if (tendance !== "BAISSE") return null;

  return (
    <div className="flex flex-direction-row fr-ml-2w fr-mr-1w">
      <Icone icone={DecroissanceIcon} />
      <p className="fr-text--xs !text-dsfr-mention-grey fr-ml-1w fr-pt-1v fr-mb-1w">
        Attention, cet indicateur a un objectif de baisse. La cible représente
        une valeur inférieure à la valeur initiale.
      </p>
    </div>
  );
};
