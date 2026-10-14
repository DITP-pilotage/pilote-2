import { Icone } from "@/components/_commons/Icone";
import { DecroissanceIcon } from "@/components/_commons/Icones/DecroissanceIcon";

export const IndicateurTendance = ({
  tendance,
}: {
  tendance: string | null;
}) => {
  if (tendance !== "BAISSE") return null;

  return (
    <div className="flex flex-row ml-4 mr-2">
      <Icone icone={DecroissanceIcon} />
      <p className="text-xs print:text-base text-dsfr-mention-grey ml-2 pt-1 mb-2">
        Attention, cet indicateur a un objectif de baisse. La cible représente
        une valeur inférieure à la valeur initiale.
      </p>
    </div>
  );
};
