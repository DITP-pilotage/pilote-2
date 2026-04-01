import clsx from "clsx";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
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
  const territoireSélectionné = useTerritoireSelectionne();

  return (
    <IndicateurDetailsModeProvider mode="widget">
      <BasePageChantierLayout>
        <div
          className={clsx(
            "grid [grid-template-areas:'avancement'_'synthèse'_'responsables'] gap-[0.7rem]",
            territoireSélectionné.maille === "nationale"
              ? "md:grid-cols-1 print:[grid-template-areas:'avancement_synthèse'_'responsables_responsables'] print:grid-cols-[auto_minmax(22.5rem,1fr)]"
              : "",
          )}
        >
          <SectionAvancementChantier />
          <SectionSyntheseDesResultats />
          <SectionResponsables />
        </div>
        <SectionRepartitionGeographique />
        <SectionObjectifs />
        <SectionIndicateurs />
        <SectionDecisionsStrategiques />
        <SectionCommentaires />
      </BasePageChantierLayout>
    </IndicateurDetailsModeProvider>
  );
};
