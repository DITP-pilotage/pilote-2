import clsx from "clsx";
import { useId } from "react";
import { BarreDeProgressionVariante } from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { estPropositionAccepteeAvecModification } from "@/components/_commons/IndicateursChantier/Bloc/utils";

export const BarreDeProgressionAVenir = ({
  variante,
}: {
  variante: BarreDeProgressionVariante;
}) => {
  const id = useId();

  const { detailIndicateurDuTerritoire } = useBlocIndicateurContext();

  return (
    <div className="flex flex-col gap-1 text-current">
      <div className="flex items-center gap-1">
        <div className="font-bold">à venir</div>
        <Infobulle
          classNameBouton={clsx("!-my-1", {
            "before:!bg-dsfr-moutarde-main-679": variante === "jaune-moutarde",
            "before:!bg-dsfr-info-main-525": variante === "bleu-dsfr-info",
          })}
          idHtml={id}
          styleIconInfoBulle="question"
        >
          <p className="fr-text--sm fr-mb-0">
            La proposition de valeur d'avancement a bien été acceptée{" "}
            {estPropositionAccepteeAvecModification(
              detailIndicateurDuTerritoire,
            )
              ? "avec modification"
              : ""}{" "}
            par la direction de projet et est visible par tous les utilisateurs.
            Le taux d'avancement est en cours d'intégration dans la base de
            données de PILOTE. L'ensemble des informations seront consolidées
            dans ce tableau dans un délai maximal de deux heures et vous aurez à
            nouveau la possibilité de faire une proposition de valeur
            d'avancement.
          </p>
        </Infobulle>
      </div>
      <div
        className={clsx("w-full h-3 rounded-full overflow-hidden", {
          "[background-image:repeating-linear-gradient(135deg,#1483ff_0_4px,#fff_4px_8px)]":
            variante === "bleu-dsfr-info",
          "[background-image:repeating-linear-gradient(135deg,#c3992a_0_4px,#fff_4px_8px)]":
            variante === "jaune-moutarde",
        })}
      />
    </div>
  );
};
