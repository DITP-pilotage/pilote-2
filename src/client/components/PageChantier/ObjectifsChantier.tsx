import { FunctionComponent } from "react";
import { TypeObjectif } from "@/client/constants/libellésObjectif";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { typesObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { Accordion } from "@/components/shared/Accordion";
import { ObjectifSection } from "@/components/PageChantier/ObjectifsChantier/ObjectifSection";

export interface ObjectifsChantierProps {
  modeÉcriture?: boolean;
}

export const ObjectifsChantier: FunctionComponent<ObjectifsChantierProps> = ({
  modeÉcriture = false,
}) => {
  const { chantier, objectifs, objectifsBrouillon } =
    pageChantier.useServerSidePropsContext();

  return (
    <Bloc
      backgroundClassNameTitre={
        chantier.statut === "ARCHIVE"
          ? "bg-dsfr-grey-925"
          : "bg-dsfr-blue-france-925"
      }
      contenuClassesSupplémentaires=""
      titre="National"
    >
      <Accordion.Root collapsible type="single">
        {typesObjectif.map((type) => (
          <ObjectifSection
            chantierId={chantier.id}
            key={type}
            modeEcriture={modeÉcriture}
            type={type as TypeObjectif}
            objectif={objectifs[type]}
            brouillon={objectifsBrouillon[type]}
          />
        ))}
      </Accordion.Root>
    </Bloc>
  );
};
