import api from "@/server/infrastructure/api/trpc/api";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";

const COULEUR_MINIMUM = "#cbcbe8";
const COULEUR_MEDIANE = "#6666bd";
const COULEUR_MAXIMUM = "#000091";

const libelleMaille = (maille: MailleInterne): string =>
  maille === "departementale" ? "départements" : "régions";

const formatValeur = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
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
  chantierId,
  maille,
  jalon,
}: {
  chantierId: string;
  maille: MailleInterne;
  jalon: number;
}) => {
  const [statistiques] =
    api.chantier.recupererStatistiquesAvancement.useSuspenseQuery({
      chantierIds: [chantierId],
      maille,
      jalon,
    });

  if (!statistiques) return null;

  const minimum = formatValeur(statistiques.minimum);
  const mediane = formatValeur(statistiques.médiane);
  const maximum = formatValeur(statistiques.maximum);
  const libelle = libelleMaille(maille);

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
