import {
  libellesMotifsActionsIndisponibles,
  MotifsActionsIndisponibles,
} from "./motifsActionsIndisponibles";

export const MotifsActionsIndisponiblesTexte = ({
  id,
  motifs,
}: {
  id: string;
  motifs: MotifsActionsIndisponibles;
}) => {
  const libelles = libellesMotifsActionsIndisponibles(motifs);

  if (libelles.length === 0) return null;

  return (
    <div className="mt-2 text-right" id={id}>
      {libelles.map((libelle) => (
        <p className="text-xs text-dsfr-mention-grey mb-0" key={libelle}>
          {libelle}
        </p>
      ))}
    </div>
  );
};
