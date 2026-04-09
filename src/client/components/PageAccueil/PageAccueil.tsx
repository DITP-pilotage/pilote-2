import { FunctionComponent } from "react";
import { InferGetServerSidePropsType } from "next";
import {
  PageAccueilProvider,
  PageAccueilContextValue,
} from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilLayout } from "@/components/PageAccueil/BasePageAccueilLayout";
import { SectionAvancementMoyen } from "@/components/PageAccueil/sections/SectionAvancementMoyen";
import { SectionRepartitionTerritoriale } from "@/components/PageAccueil/sections/SectionRepartitionTerritoriale";
import { SectionRepartitionMeteos } from "@/components/PageAccueil/sections/SectionRepartitionMeteos";
import { SectionCartographie } from "@/components/PageAccueil/sections/SectionCartographie";
import { SectionComparaisonTerritoires } from "@/components/PageAccueil/sections/SectionComparaisonTerritoires";
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
        <main>
          <div className="py-4 px-0 md:px-4">
            <div className="fr-grid-row">
              <div className="fr-col-12 fr-col-lg-7 fr-col-xl-6 flex flex-col">
                <section className="flex flex-1">
                  <div className="fr-container fr-p-0 flex flex-1">
                    <div className="fr-grid-row fr-grid-row--gutters fr-mb-0 fr-mt-0 w-full mr-0 md:mr-4">
                      <div className="fr-col-12 fr-col-xl-6 flex flex-col items-center pr-0 pt-0">
                        <SectionAvancementMoyen />
                      </div>
                      <div className="fr-col-12 fr-col-xl-6 pr-0 pt-0">
                        <SectionRepartitionTerritoriale />
                      </div>
                    </div>
                  </div>
                </section>
                <div className="mr-0 md:mr-4 xl:mr-0">
                  <SectionRepartitionMeteos />
                </div>
              </div>
              <div className="fr-col-12 fr-col-lg-5 fr-col-xl-6 xl:pl-2">
                <SectionCartographie />
              </div>
            </div>
            <SectionComparaisonTerritoires />
            <SectionChantiersSignales />
            <SectionTableauChantiers />
          </div>
        </main>
      </BasePageAccueilLayout>
    </PageAccueilProvider>
  );
};
