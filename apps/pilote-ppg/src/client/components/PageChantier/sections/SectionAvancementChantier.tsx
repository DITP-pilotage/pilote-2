import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { AvancementChantierWidget } from "@/components/PageChantier/AvancementChantierWidget/AvancementChantierWidget";
import { useEnv } from "@/client/hooks/useEnv";
import { BasePageChantierSection } from "./BasePageChantierSection";

const useInfobulle = () => {
  const { indicateurPondérations } = pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();
  const ffInfobullePonderation = useEnv("NEXT_PUBLIC_FF_INFOBULLE_PONDERATION");

  if (!ffInfobullePonderation) {
    return null;
  }

  if (indicateurPondérations.length === 0) {
    return INFOBULLE_CONTENUS.chantier.avancement.aucunIndicateur(
      territoireSélectionné.maille,
    );
  }

  if (indicateurPondérations.length === 1) {
    return INFOBULLE_CONTENUS.chantier.avancement.unSeulIndicateur(
      territoireSélectionné.maille,
      indicateurPondérations[0],
    );
  }

  return INFOBULLE_CONTENUS.chantier.avancement.plusieursIndicateurs(
    territoireSélectionné.maille,
    indicateurPondérations,
  );
};

export const SectionAvancementChantier = () => {
  const infobulle = useInfobulle();

  return (
    <BasePageChantierSection
      id="avancement"
      infobulle={infobulle}
      sectionClassName="print:break-inside-avoid [grid-area:avancement]"
      titre="Avancement du chantier"
    >
      <AvancementChantierWidget />
    </BasePageChantierSection>
  );
};
