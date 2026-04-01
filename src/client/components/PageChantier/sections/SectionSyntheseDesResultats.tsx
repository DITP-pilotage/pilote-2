import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import SyntheseDesResultats from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultats";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { usePageChantier } from "@/components/PageChantier/usePageChantier";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionSyntheseDesResultats = () => {
  const territoireSélectionné = useTerritoireSelectionne();
  const { estAutoriseAModifierLesPublications } = usePageChantier();

  return (
    <BasePageChantierSection
      id="synthèse"
      infobulle={INFOBULLE_CONTENUS.chantier.météoEtSynthèseDesRésultats}
      sectionClassName="[grid-area:synthèse]"
      titre="Météo et synthèse des résultats"
    >
      <SyntheseDesResultats
        modeEcriture={estAutoriseAModifierLesPublications}
        nomTerritoire={territoireSélectionné.nomAffiché}
      />
    </BasePageChantierSection>
  );
};
