import { FunctionComponent, ReactNode } from "react";
import { Infobulle } from "@/client/components/_commons/Infobulle/Infobulle";
import { Progress } from "@/components/shared/Progress";
import { clsxm } from "@/utils/clsxm";

export type BarreDeProgressionVariante =
  | "primaire"
  | "primaire-light"
  | "secondaire"
  | "secondaire-light"
  | "rose"
  | "jaune-moutarde"
  | "bleu-clair"
  | "bleu-dsfr-info"
  | "grey-dsfr";
type BarreDeProgressionTaille = "xxs" | "xs" | "sm" | "md" | "lg";
type BarreDeProgressionFond = "bleu" | "blanc" | "gris-moyen" | "gris-clair";
type BarreDeProgressionBordure = "bleu" | "gris-moyen" | null;
type BarreDeProgressionPositionTexte = "côté" | "dessus";

const HAUTEUR_TAILLE: Record<BarreDeProgressionTaille, string> = {
  xxs: "h-2",
  xs: "h-2.5",
  sm: "h-3",
  md: "h-3",
  lg: "h-8",
};

const COULEUR_FOND: Record<BarreDeProgressionFond, string> = {
  bleu: "bg-[var(--blue-ecume-850-200)]",
  blanc: "bg-white",
  "gris-moyen": "bg-pilote-gris-moyen",
  "gris-clair": "bg-dsfr-grey-925",
};

const COULEUR_BORDURE: Record<string, string> = {
  bleu: "border border-[var(--blue-ecume-850-200)]",
  "gris-moyen": "border border-pilote-gris-moyen",
};

const COULEUR_VARIANTE: Record<BarreDeProgressionVariante, string> = {
  primaire: "bg-primary",
  "primaire-light": "bg-dsfr-blue-france-sun-113",
  secondaire: "bg-dsfr-mention-grey",
  "secondaire-light": "bg-dsfr-grey-625",
  rose: "bg-dsfr-pink-tuile-main-556",
  "jaune-moutarde": "bg-dsfr-moutarde-main-679",
  "bleu-clair": "bg-[var(--background-flat-info)]",
  "bleu-dsfr-info": "bg-dsfr-info-main-525",
  "grey-dsfr": "bg-dsfr-grey-200",
};

const COULEUR_TEXTE_FOND: Record<BarreDeProgressionFond, string> = {
  bleu: "text-[var(--blue-ecume-850-200)]",
  blanc: "text-white",
  "gris-moyen": "text-pilote-gris-moyen",
  "gris-clair": "text-dsfr-grey-925",
};

const LARGEUR_POURCENTAGE: Record<BarreDeProgressionTaille, string> = {
  xxs: "w-10",
  xs: "w-10",
  sm: "w-10",
  md: "w-10",
  lg: "w-[6.5rem]",
};

interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille;
  variante: BarreDeProgressionVariante;
  fond?: BarreDeProgressionFond;
  bordure?: BarreDeProgressionBordure;
  valeur: number | null;
  positionTexte?: BarreDeProgressionPositionTexte;
  afficherTexte?: boolean;
  texteInfobulle?: ReactNode;
  texteCentre?: boolean;
}

const dimensions: Record<BarreDeProgressionTaille, { classNameDsfr: string }> =
  {
    xxs: { classNameDsfr: "fr-text--xs" },
    xs: { classNameDsfr: "fr-text--xs" },
    sm: { classNameDsfr: "fr-text--xs" },
    md: { classNameDsfr: "fr-text--sm" },
    lg: { classNameDsfr: "fr-h1" },
  };

const BarreDeProgression: FunctionComponent<BarreDeProgressionProps> = ({
  taille,
  variante,
  fond = "gris-moyen",
  bordure = "gris-moyen",
  positionTexte = "côté",
  valeur,
  afficherTexte = true,
  texteInfobulle,
  texteCentre = false,
}) => {
  const pourcentageAffiché = valeur === null ? "- %" : `${valeur.toFixed(0)} %`;

  return (
    <div
      className={clsxm(
        "barre-de-progression flex w-full",
        positionTexte === "côté" && "flex-row items-center",
        positionTexte === "dessus" && "flex-col-reverse",
      )}
    >
      <div className="grow">
        <Progress
          className={clsxm(
            HAUTEUR_TAILLE[taille],
            COULEUR_FOND[fond],
            bordure && COULEUR_BORDURE[bordure],
          )}
          indicatorClassName={valeur ? COULEUR_VARIANTE[variante] : undefined}
          max={100}
          value={valeur ?? 0}
        />
      </div>
      {afficherTexte ? (
        <div
          className={clsxm(
            "flex",
            positionTexte === "côté" && LARGEUR_POURCENTAGE[taille],
            texteCentre ? "justify-center" : "justify-between",
          )}
        >
          <p
            className={clsxm(
              "fr-mb-0 bold fr-mr-1w whitespace-nowrap align-middle",
              dimensions[taille].classNameDsfr,
              positionTexte === "côté" && "pl-2 text-right",
              COULEUR_TEXTE_FOND[fond],
            )}
          >
            {pourcentageAffiché}
          </p>
          {texteInfobulle ? (
            <Infobulle
              classNameBouton="infobulle-taux-avancement"
              styleIconInfoBulle="question"
            >
              <p className="fr-text--sm fr-text-title--blue-france">
                Taux d'avancement :
              </p>
              <p className="fr-text--sm fr-mb-0">{texteInfobulle}</p>
            </Infobulle>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default BarreDeProgression;
