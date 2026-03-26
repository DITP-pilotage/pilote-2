import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import {
  TerritoireProgressBar,
  TerritoireProgressBarVariant,
} from "@/components/_commons/Widget/TerritoireProgressBar";

export type SuiviTerritoireItem = {
  territoireCode: string;
  nom: string;
  estApplicable: boolean | null;
  pourcentage: number | null;
  libelle: string;
  dateMaj?: string | null;
};

export const SuiviTerritoires = ({
  territoires,
  territoireCode,
  onSupprimerTerritoire,
  variant = "progressBar",
}: {
  territoires: SuiviTerritoireItem[];
  territoireCode: string;
  onSupprimerTerritoire: (territoireCode: string) => void;
  variant?: TerritoireProgressBarVariant;
}) => (
  <div className="text-xs flex flex-col">
    {territoires.map((territoire) => {
      const estInitial = territoire.territoireCode === territoireCode;
      const couleur = getCouleurTerritoireParCode(territoire.territoireCode);

      return (
        <div
          key={territoire.territoireCode}
          className="grid grid-cols-[120px_1fr_auto] items-center py-1"
        >
          <TerritoireLabel
            nom={territoire.nom}
            couleur={couleur}
            onSupprimer={
              !estInitial
                ? () => onSupprimerTerritoire(territoire.territoireCode)
                : undefined
            }
          />

          {territoire.estApplicable === false ? (
            <span className="col-span-2 text-center">Non applicable</span>
          ) : territoire.pourcentage === null ? (
            <span className="col-span-2 text-center">Non renseigné</span>
          ) : (
            <TerritoireProgressBar
              pourcentage={territoire.pourcentage}
              libelle={territoire.libelle}
              couleur={couleur}
              dateMaj={territoire.dateMaj}
              variant={variant}
            />
          )}
        </div>
      );
    })}
  </div>
);
