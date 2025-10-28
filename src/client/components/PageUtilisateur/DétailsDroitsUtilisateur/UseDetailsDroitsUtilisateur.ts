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
    .reduce((elements, chantier) => {
      const info = listeInformationsChantiers?.find((i) => i.id === chantier);

      if (!info) {
        return elements;
      }

      if (info.statut === "ARCHIVE") {
        elements.push({
          label: `${info.nom} (archivés)`,
          className: "italic !text-dsfr-mention-grey",
        });
      } else {
        elements.push({ label: info.nom });
      }

      return elements;
    }, [] as ElementListeDroitType[])
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
