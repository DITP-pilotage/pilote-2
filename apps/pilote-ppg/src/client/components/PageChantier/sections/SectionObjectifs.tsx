import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { ObjectifsChantier } from "@/components/PageChantier/ObjectifsChantier";
import { usePageChantier } from "@/components/PageChantier/usePageChantier";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionObjectifs = () => {
  const { estAutoriseAModifierLesObjectifs } = usePageChantier();

  return (
    <BasePageChantierSection
      id="objectifs"
      infobulle={INFOBULLE_CONTENUS.chantier.objectifs}
      titreConteneurClassName="mb-4 mt-3 md:mt-0 mx-4 md:mx-0"
      titre="Objectifs"
    >
      <ObjectifsChantier modeÉcriture={estAutoriseAModifierLesObjectifs} />
    </BasePageChantierSection>
  );
};
