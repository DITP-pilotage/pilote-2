import { InformationChantierUtilisateur } from "@/server/gestion-utilisateur/domain/InformationChantierUtilisateur";
import { ElementListeDroitType } from "./ListeDeDroit";

export default function useDetailsDroitsUtilisateur({
  territoires,
  chantiers,
  listeInformationsChantiers,
}: {
  territoires: string[];
  chantiers: string[];
  listeInformationsChantiers: InformationChantierUtilisateur[];
}) {
  const listeElementsChantiers: ElementListeDroitType[] = chantiers
    .map((chantier) => {
      const info = listeInformationsChantiers?.find((i) => i.id === chantier);

      if (!info) {
        return { label: chantier };
      }

      if (info.statut === "ARCHIVE") {
        return {
          label: `${info.nom} (archivés)`,
          className: "italic !text-dsfr-mention-grey",
        };
      }

      return { label: info.nom };
    })
    .sort((a) => (a.className ? 1 : -1));

  const listeElementsTerritoires: ElementListeDroitType[] = territoires.map(
    (territoire) => {
      return { label: territoire };
    },
  );
  return {
    listeElementsChantiers,
    listeElementsTerritoires,
  };
}
