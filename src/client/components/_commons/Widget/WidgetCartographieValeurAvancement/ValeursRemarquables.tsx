import { useMemo } from "react";
import {
  calculerMediane,
  valeurMaximum,
  valeurMinimum,
} from "@/client/utils/statistiques/statistiques";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { ValeurAvancementIndicateurTerritoire } from "./types";

const COULEUR_MINIMUM = "#8bcdb1";
const COULEUR_MEDIANE = "#47a882";
const COULEUR_MAXIMUM = "#083a25";

const libelleMaille = (maille: MailleInterne): string =>
  maille === "departementale" ? "départements" : "régions";

const formatValeur = (
  valeur: number | null,
  unite: string | null,
): string | null => {
  if (valeur === null) return null;
  const unitéAffichée =
    unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

const ValeurRemarquable = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="fr-mb-0 items-center flex flex-col p-2 basis-1/2 grow">
    <strong className="text-xl" style={{ color }}>
      {value}
    </strong>
    <span className="inline-block text-center">{label}</span>
  </div>
);

export const ValeursRemarquables = ({
  territoires,
  maille,
  unite,
}: {
  territoires: ValeurAvancementIndicateurTerritoire[];
  maille: MailleInterne;
  unite: string | null;
}) => {
  const statistiques = useMemo(() => {
    const valeurs = territoires
      .filter((territoire) => territoire.estApplicable !== false)
      .map((territoire) => territoire.valeurAvancement);

    return {
      minimum: valeurMinimum(valeurs),
      mediane: calculerMediane(valeurs),
      maximum: valeurMaximum(valeurs),
    };
  }, [territoires]);

  const minimum = formatValeur(statistiques.minimum, unite);
  const mediane = formatValeur(statistiques.mediane, unite);
  const maximum = formatValeur(statistiques.maximum, unite);
  const libelle = libelleMaille(maille);

  if (minimum === null && mediane === null && maximum === null) return null;

  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row md:flex-wrap md:justify-center">
        {minimum !== null && (
          <ValeurRemarquable
            color={COULEUR_MINIMUM}
            label={`minimum des ${libelle}`}
            value={minimum}
          />
        )}
        {mediane !== null && (
          <ValeurRemarquable
            color={COULEUR_MEDIANE}
            label={`médiane des ${libelle}`}
            value={mediane}
          />
        )}
        {maximum !== null && (
          <ValeurRemarquable
            color={COULEUR_MAXIMUM}
            label={`maximum des ${libelle}`}
            value={maximum}
          />
        )}
      </div>
    </div>
  );
};
