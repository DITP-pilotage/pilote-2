import { MailleInterne } from "@/server/domain/maille/Maille.interface";

const libelleMaille = (maille: MailleInterne): string =>
  maille === "departementale" ? "départements" : "régions";

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
  valeurs,
  palette,
  maille,
}: {
  valeurs: {
    minimum: string | null;
    mediane: string | null;
    maximum: string | null;
  };
  palette: { minimum: string; mediane: string; maximum: string };
  maille: MailleInterne;
}) => {
  const libelle = libelleMaille(maille);

  if (
    valeurs.minimum === null &&
    valeurs.mediane === null &&
    valeurs.maximum === null
  )
    return null;

  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row md:flex-wrap md:justify-center">
        {valeurs.minimum !== null && (
          <ValeurRemarquable
            color={palette.minimum}
            label={`minimum des ${libelle}`}
            value={valeurs.minimum}
          />
        )}
        {valeurs.mediane !== null && (
          <ValeurRemarquable
            color={palette.mediane}
            label={`médiane des ${libelle}`}
            value={valeurs.mediane}
          />
        )}
        {valeurs.maximum !== null && (
          <ValeurRemarquable
            color={palette.maximum}
            label={`maximum des ${libelle}`}
            value={valeurs.maximum}
          />
        )}
      </div>
    </div>
  );
};
