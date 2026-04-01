import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import Cartes from "@/components/PageChantier/Cartes/Cartes";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionRepartitionGeographiqueLegacy = () => {
  const { chantier, mailleSelectionnee, territoireCode } =
    pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();

  const mailleSourceDonnees =
    chantier.mailles[territoireSélectionné.maille][territoireCode]
      .mailleSourceDonnees;

  const estVisible =
    !!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] ||
    !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
    chantier.estTerritorialisé;

  if (!estVisible) {
    return null;
  }

  return (
    <div className="fr-my-2w">
      <BasePageChantierSection
        id="cartes"
        sectionClassName="print:break-inside-avoid"
        titre="Répartition géographique"
      >
        <Cartes mailleSourceDonnees={mailleSourceDonnees} />
      </BasePageChantierSection>
    </div>
  );
};
