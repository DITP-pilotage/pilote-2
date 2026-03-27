import { FunctionComponent } from "react";
import { JaugeDeProgressionSmallCouleur } from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall.interface";
import JaugeDeProgressionSVG from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSVGSmall";

const COULEUR_TEXTE: Record<JaugeDeProgressionSmallCouleur, string> = {
  bleu: "text-primary",
  "bleu-clair": "text-dsfr-info-main-525",
  violet: "text-pilote-ecart-blue",
  orange: "text-pilote-orange",
  vert: "text-pilote-vert",
  rose: "text-dsfr-pink-tuile-main-556",
  gris: "text-dsfr-grey-625",
};

interface JaugeDeProgressionSmallProps {
  couleur: JaugeDeProgressionSmallCouleur;
  libellé: string;
  pourcentage: number | null | undefined;
}

export const JaugeDeProgressionSmall: FunctionComponent<
  JaugeDeProgressionSmallProps
> = ({ couleur, libellé, pourcentage }) => {
  return (
    <div className="relative flex flex-col items-center">
      <div className="flex fr-mb-2w">
        <div className="flex relative w-[3.75rem] fr-mr-1w">
          <JaugeDeProgressionSVG
            couleur={couleur}
            pourcentage={pourcentage !== undefined ? pourcentage : null}
          />
        </div>
        <div className="flex flex-column justify-center">
          <p
            className={`mb-0 break-normal ${COULEUR_TEXTE[couleur]} text-center fr-h5 fr-mb-0`}
          >
            {`${pourcentage?.toFixed(0) ?? "- "}%`}
          </p>
          <p className="fr-text--xs fr-mb-0 text-center">{libellé}</p>
        </div>
      </div>
    </div>
  );
};
