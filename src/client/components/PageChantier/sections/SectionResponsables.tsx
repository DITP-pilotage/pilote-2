import ResponsablesPageChantier from "@/components/PageChantier/ResponsablesChantier/ResponsablesChantier";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionResponsables = () => {
  const { chantier, listeResponsablesLocaux, listeCoordinateursTerritorials } =
    pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();
  const estChantierArchive = chantier.statut === "ARCHIVE";

  return (
    <BasePageChantierSection
      id="responsables"
      sectionClassName="print:break-inside-avoid [grid-area:responsables]"
      titre="Responsables"
    >
      <ResponsablesPageChantier
        afficheResponsablesLocaux={territoireSélectionné.maille !== "nationale"}
        estChantierArchive={estChantierArchive}
        libelléChantier={chantier.nom}
        listeCoordinateursTerritorials={listeCoordinateursTerritorials}
        listeDirecteursProjets={chantier.responsables.directeursProjet}
        listeResponsablesLocaux={listeResponsablesLocaux}
        maille={territoireSélectionné.maille}
      />
    </BasePageChantierSection>
  );
};
