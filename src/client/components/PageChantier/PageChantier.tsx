import { BasePageChantierLayout } from "./BasePageChantierLayout";
import { IndicateurDetailsModeProvider } from "./IndicateurDetailsContext";
import { SectionAvancementChantier } from "./sections/SectionAvancementChantier";
import { SectionSyntheseDesResultats } from "./sections/SectionSyntheseDesResultats";
import { SectionResponsables } from "./sections/SectionResponsables";
import { SectionRepartitionGeographique } from "./sections/SectionRepartitionGeographique";
import { SectionObjectifs } from "./sections/SectionObjectifs";
import { SectionIndicateurs } from "./sections/SectionIndicateurs";
import { SectionDecisionsStrategiques } from "./sections/SectionDecisionsStrategiques";
import { SectionCommentaires } from "./sections/SectionCommentaires";

export const PageChantier = () => {
  return (
    <IndicateurDetailsModeProvider mode="widget">
      <BasePageChantierLayout>
        <div className="flex flex-col gap-6">
          <SectionAvancementChantier />
          <SectionSyntheseDesResultats />
          <SectionResponsables />
          <SectionRepartitionGeographique />
          <SectionObjectifs />
          <SectionIndicateurs />
          <SectionDecisionsStrategiques />
          <SectionCommentaires />
        </div>
      </BasePageChantierLayout>
    </IndicateurDetailsModeProvider>
  );
};
