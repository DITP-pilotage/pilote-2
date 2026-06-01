import { FunctionComponent } from "react";
import { InferGetServerSidePropsType } from "next";
import {
  PageAccueilProvider,
  PageAccueilContextValue,
} from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilLayout } from "@/components/PageAccueil/BasePageAccueilLayout";
import { SectionAvancementMoyen } from "@/components/PageAccueil/sections/SectionAvancementMoyen";
import { SectionCartographieTA } from "@/components/PageAccueil/sections/SectionCartographieTA";
import { SectionRepartitionMeteos } from "@/components/PageAccueil/sections/SectionRepartitionMeteos";
import { SectionChantiersSignales } from "@/components/PageAccueil/sections/SectionChantiersSignales";
import { SectionTableauChantiers } from "@/components/PageAccueil/sections/SectionTableauChantiers";
import type { getServerSideProps } from "@/pages/accueil/chantier/[territoireCode]/index";

type PageAccueilProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export const PageAccueil: FunctionComponent<PageAccueilProps> = (props) => {
  const contextValue: PageAccueilContextValue = {
    chantiers: props.chantiers,
    chantierIds: props.chantierIds,
    chantierIdsSansFiltrageAlertes: props.chantierIdsSansFiltrageAlertes,
    nombreTotalChantiersAvecAlertes: props.nombreTotalChantiersAvecAlertes,
    ministères: props.ministères,
    territoireCode: props.territoireCode,
    mailleQuery: props.mailleQuery,
    filtresComptesCalculés: props.filtresComptesCalculés,
    avancementsAgrégés: props.avancementsAgrégés,
    avancementsGlobauxTerritoriauxMoyens:
      props.avancementsGlobauxTerritoriauxMoyens,
    repartitionMeteosChantiers: props.repartitionMeteosChantiers,
    jalon: props.jalon,
    jalonParDefaut: props.jalonParDefaut,
    moyenneTerritoire: props.moyenneTerritoire,
  };

  return (
    <PageAccueilProvider value={contextValue}>
      <BasePageAccueilLayout
        axes={props.axes}
        aDejaVuVideoAccueil={props.aDejaVuVideoAccueil}
        doitAfficherLaModaleInfolettre={props.doitAfficherLaModaleInfolettre}
        emailAutoriseAskAITerritoire={props.emailAutoriseAskAITerritoire}
        jalon={props.jalon}
        mailleQuery={props.mailleQuery}
        mailleSelectionnee={props.mailleSelectionnee}
        ministères={props.ministères}
        nombreTotalChantiersAvecAlertes={props.nombreTotalChantiersAvecAlertes}
        territoireCode={props.territoireCode}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <SectionAvancementMoyen />
            <SectionCartographieTA />
          </div>
          <div className="flex flex-col gap-2">
            <SectionRepartitionMeteos />
            <SectionChantiersSignales />
          </div>
        </div>
        <SectionTableauChantiers />
      </BasePageAccueilLayout>
    </PageAccueilProvider>
  );
};
