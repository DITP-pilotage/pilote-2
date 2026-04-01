import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { ObjectifsChantier } from "@/components/PageChantier/ObjectifsChantier";
import { usePageChantier } from "@/components/PageChantier/usePageChantier";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionObjectifs = () => {
  const { estAutoriseAModifierLesObjectifs } = usePageChantier();

  return (
    <div className="fr-my-2w">
      <BasePageChantierSection
        id="objectifs"
        infobulle={INFOBULLE_CONTENUS.chantier.objectifs}
        titreConteneurClassName="fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
        titre="Objectifs"
      >
        <ObjectifsChantier modeÉcriture={estAutoriseAModifierLesObjectifs} />
      </BasePageChantierSection>
    </div>
  );
};
