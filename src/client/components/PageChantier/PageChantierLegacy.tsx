import clsx from "clsx";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import AvancementChantier from "./AvancementChantier/AvancementChantier";
import { BasePageChantierLayout } from "./BasePageChantierLayout";
import { SectionSyntheseDesResultats } from "./sections/SectionSyntheseDesResultats";
import { SectionResponsables } from "./sections/SectionResponsables";
import { SectionRepartitionGeographique } from "./sections/SectionRepartitionGeographique";
import { SectionObjectifs } from "./sections/SectionObjectifs";
import { SectionIndicateurs } from "./sections/SectionIndicateurs";
import { SectionDecisionsStrategiques } from "./sections/SectionDecisionsStrategiques";
import { SectionCommentaires } from "./sections/SectionCommentaires";

const PageChantierLegacy = () => {
  const {
    chantier,
    territoireCode,
    mailleSelectionnee,
    mailleQuery,
    avancements,
    indicateurPondérations,
    jalon,
    donneesComparaisonDuTauxDAvancement,
    configurationFeatureFlipping,
  } = pageChantier.useServerSidePropsContext();

  const territoireSélectionné = useTerritoireSelectionne();

  const estChantierArchive = chantier.statut === "ARCHIVE";

  return (
    <BasePageChantierLayout>
      <div
        className={clsx(
          "grid [grid-template-areas:'avancement'_'synthèse'_'responsables'] gap-[0.7rem]",
          territoireSélectionné.maille === "nationale"
            ? "md:grid-cols-1 print:[grid-template-areas:'avancement_synthèse'_'responsables_responsables'] print:grid-cols-[auto_minmax(22.5rem,1fr)]"
            : "",
        )}
      >
        <section
          className="grid grid-rows-[auto_1fr] print:block print:break-inside-avoid [grid-area:avancement]"
          id="avancement"
        >
          <TitreInfobulleConteneur className="fr-mb-1w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0">
            <Titre
              baliseHtml="h2"
              className={clsx("fr-h4 fr-mb-0 fr-py-1v", {
                "text-primary": !estChantierArchive,
                "!text-dsfr-grey-50": estChantierArchive,
              })}
              estInline
            >
              Avancement du chantier
            </Titre>
            {configurationFeatureFlipping.infobullePonderation ? (
              indicateurPondérations.length === 0 ? (
                <Infobulle>
                  {INFOBULLE_CONTENUS.chantier.avancement.aucunIndicateur(
                    territoireSélectionné.maille,
                  )}
                </Infobulle>
              ) : indicateurPondérations.length === 1 ? (
                <Infobulle>
                  {INFOBULLE_CONTENUS.chantier.avancement.unSeulIndicateur(
                    territoireSélectionné.maille,
                    indicateurPondérations[0],
                  )}
                </Infobulle>
              ) : (
                <Infobulle>
                  {INFOBULLE_CONTENUS.chantier.avancement.plusieursIndicateurs(
                    territoireSélectionné.maille,
                    indicateurPondérations,
                  )}
                </Infobulle>
              )
            ) : null}
          </TitreInfobulleConteneur>
          <AvancementChantier
            avancements={avancements}
            donneesComparaisonDuTauxDAvancement={
              donneesComparaisonDuTauxDAvancement
            }
            estChantierArchive={estChantierArchive}
            jalon={jalon}
            mailleQuery={mailleQuery}
            mailleSelectionnee={mailleSelectionnee}
            territoireCode={territoireCode}
          />
        </section>
        <SectionSyntheseDesResultats />
        <SectionResponsables />
      </div>
      <SectionRepartitionGeographique />
      <SectionObjectifs />
      <SectionIndicateurs />
      <SectionDecisionsStrategiques />
      <SectionCommentaires />
    </BasePageChantierLayout>
  );
};

export default PageChantierLegacy;
