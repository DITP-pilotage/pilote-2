import { FunctionComponent } from "react";
import { InferGetServerSidePropsType } from "next";
import {
  PageAccueilProvider,
  PageAccueilContextValue,
} from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilLayout } from "@/components/PageAccueil/BasePageAccueilLayout";
import { SectionAvancementMoyen } from "@/components/PageAccueil/sections/SectionAvancementMoyen";
import { SectionComparaisonTerritoires } from "@/components/PageAccueil/sections/SectionComparaisonTerritoires";
import { SectionWidgetsChantiersSignales } from "@/components/PageAccueil/sections/SectionWidgetsChantiersSignales";
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
        doitAfficherLaFicheTerritoriale={props.doitAfficherLaFicheTerritoriale}
        doitAfficherLaModaleInfolettre={props.doitAfficherLaModaleInfolettre}
        doitAfficherModaleVideoAccueil={props.doitAfficherModaleVideoAccueil}
        jalon={props.jalon}
        mailleQuery={props.mailleQuery}
        mailleSelectionnee={props.mailleSelectionnee}
        ministères={props.ministères}
        nombreTotalChantiersAvecAlertes={props.nombreTotalChantiersAvecAlertes}
        territoireCode={props.territoireCode}
      >
        <SectionAvancementMoyen />
        <SectionComparaisonTerritoires />
        <SectionWidgetsChantiersSignales />
        <SectionTableauChantiers />
      </BasePageAccueilLayout>
    </PageAccueilProvider>
  );
};
