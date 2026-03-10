import "@gouvfr/dsfr/dist/component/form/form.min.css";
import { FunctionComponent } from "react";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import CartographieAvancement from "@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement";
import useCartographie from "@/components/_commons/Cartographie/useCartographie";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import RemontéeAlerte from "@/components/_commons/RemontéeAlerteChantier/RemontéeAlerte";
import BadgeIcône from "@/components/_commons/BadgeIcône/BadgeIcône";
import { JaugeDeProgressionSmall } from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
} from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { ChantierAccueilContratV2 } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import { useEnv } from "@/client/hooks/useEnv";
import PageChantiersStyled from "./PageChantiers.styled";
import TableauChantiers from "./TableauChantiers/TableauChantiers";
import usePageChantiers from "./usePageChantiers";
import RepartitionsMeteosChantiers from "./FiltresMeteos/RepartitionsMeteosChantiers";

interface PageChantiersProps {
  chantiers: ChantierAccueilContratV2[];
  nombreTotalChantiersAvecAlertes: number;
  ministères: Ministère[];
  territoireCode: string;
  mailleQuery: MailleInterne;
  filtresComptesCalculés: Record<TypeAlerteChantier, number>;
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  jalon: number;
  moyenneTerritoire: number | null;
}

const PageChantiers: FunctionComponent<PageChantiersProps> = ({
  chantiers,
  nombreTotalChantiersAvecAlertes,
  ministères,
  territoireCode,
  mailleQuery,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  repartitionMeteosChantiers,
  jalon,
  moyenneTerritoire,
}) => {
  const ffAlertesBaisse = useEnv("NEXT_PUBLIC_FF_ALERTES_BAISSE");
  const pathname = "/accueil/chantier/[territoireCode]";
  const { auClicTerritoireCallback } = useCartographie(
    territoireCode,
    pathname,
  );

  const { listeJalonAAfficher } = useSelecteurJalon();

  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(""),
    axes: parseAsString.withDefault(""),
    meteos: parseAsString.withDefault(""),
    estBarometre: parseAsBoolean.withDefault(false),
    territorialisation: parseAsString.withDefault(""),
    maille: parseAsString.withDefault(""),
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(listeJalonAAfficher),
  });

  const { donnéesTableauChantiers, remontéesAlertes } = usePageChantiers(
    chantiers,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
  );

  const chantiersSontArchives = filtres.statut?.includes("ARCHIVE") ?? false;

  return (
    <PageChantiersStyled>
      <div className="fr-py-2w fr-px-md-2w fr-container--fluid">
        <div className="fr-grid-row">
          <div className="fr-col-12 fr-col-lg-7 fr-col-xl-6 flex flex-column">
            <section className="flex flex-1">
              <div className="fr-container fr-p-0 flex flex-1">
                <div className="fr-grid-row fr-grid-row--gutters fr-mb-0 fr-mt-0 w-full fr-mr-md-2w">
                  <div className="fr-col-12 fr-col-xl-6 flex flex-column align-center fr-pr-0 fr-pt-0">
                    <Bloc
                      className="w-full h-full"
                      contenuClassesSupplémentaires="fr-p-2w"
                    >
                      <TitreInfobulleConteneur>
                        <Titre
                          baliseHtml="h2"
                          className="fr-text--lg fr-mb-0 fr-py-1v"
                          estInline
                        >
                          Taux d'avancement moyen
                        </Titre>
                        <Infobulle>
                          {INFOBULLE_CONTENUS.chantiers.jauges}
                        </Infobulle>
                      </TitreInfobulleConteneur>
                      <div className="flex w-full justify-center fr-px-1w fr-mt-1w">
                        <JaugeDeProgression
                          couleur={chantiersSontArchives ? "gris" : "bleu"}
                          libellé={`Taux d'avancement à échéance ${jalon}`}
                          pourcentage={moyenneTerritoire}
                          taille="lg"
                        />
                      </div>
                    </Bloc>
                  </div>
                  <div className="fr-col-12 fr-col-xl-6 fr-pr-0 fr-pt-0">
                    <Bloc
                      className="h-full fr-ml-xl-1w"
                      contenuClassesSupplémentaires="fr-p-2w"
                    >
                      <div className="fr-container fr-p-0">
                        <TitreInfobulleConteneur className="mb-6">
                          <Titre
                            baliseHtml="h2"
                            className="fr-text--lg fr-py-1v !mb-0"
                            estInline
                          >
                            {`Répartition territoriale ${jalon}`}
                          </Titre>
                          <Infobulle>
                            {INFOBULLE_CONTENUS.chantiers.repartitions}
                          </Infobulle>
                        </TitreInfobulleConteneur>
                        <div className="flex flex-column items-center fr-px-3v">
                          <JaugeDeProgressionSmall
                            couleur={chantiersSontArchives ? "gris" : "vert"}
                            libellé="Maximum"
                            pourcentage={avancementsAgrégés.maximum || null}
                          />
                          <JaugeDeProgressionSmall
                            couleur={chantiersSontArchives ? "gris" : "violet"}
                            libellé="Médiane"
                            pourcentage={avancementsAgrégés.médiane || null}
                          />
                          <JaugeDeProgressionSmall
                            couleur={chantiersSontArchives ? "gris" : "orange"}
                            libellé="Minimum"
                            pourcentage={avancementsAgrégés.minimum || null}
                          />
                        </div>
                      </div>
                    </Bloc>
                  </div>
                </div>
              </div>
            </section>
            <section className="fr-mr-md-2w fr-mr-xl-0">
              <Bloc contenuClassesSupplémentaires="fr-py-2w fr-px-3w">
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml="h2"
                    className="fr-text--lg fr-mb-0 fr-py-1v"
                    estInline
                  >
                    Répartition des météos renseignées
                  </Titre>
                  <Infobulle>{INFOBULLE_CONTENUS.chantiers.météos}</Infobulle>
                </TitreInfobulleConteneur>
                <RepartitionsMeteosChantiers
                  repartitionMeteos={repartitionMeteosChantiers}
                />
              </Bloc>
            </section>
          </div>
          <div className="fr-col-12 fr-col-lg-5 fr-col-xl-6 fr-pl-xl-1w">
            <Bloc>
              <section>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg break-keep fr-mb-0 fr-py-1v"
                >
                  Taux d'avancement des chantiers par territoire
                </Titre>
                <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={avancementsGlobauxTerritoriauxMoyens}
                  jalon={jalon}
                  mailleSelectionnee={mailleQuery}
                  pathname="/accueil/chantier/[territoireCode]"
                  territoireCode={territoireCode}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
              </section>
            </Bloc>
          </div>
        </div>
        {!chantiersSontArchives && (
          <div className="fr-pt-2w fr-px-2w fr-px-md-0 alertes">
            <div className="fr-mb-2w">
              <TitreInfobulleConteneur>
                <BadgeIcône type="warning" />
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg fr-mb-0 fr-py-1v fr-ml-1w !text-dsfr-warning-425"
                  estInline
                >
                  Chantiers signalés
                </Titre>
                <Infobulle classNameBouton="!text-dsfr-warning-425">
                  {INFOBULLE_CONTENUS.chantiers.alertes}
                </Infobulle>
              </TitreInfobulleConteneur>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {remontéesAlertes.map(
                ({ nomCritère, libellé, nombre, estActivée }) =>
                  (ffAlertesBaisse || nomCritère !== "estEnAlerteBaisse") && (
                    <div key={libellé} title={libellé}>
                      <RemontéeAlerte
                        estActivée={estActivée}
                        libellé={libellé}
                        nomCritère={nomCritère}
                        nombre={nombre}
                      />
                    </div>
                  ),
              )}
            </div>
          </div>
        )}
        <div className="fr-grid-row fr-mt-7v">
          <div className="fr-col-12">
            <Bloc>
              <TitreInfobulleConteneur>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg fr-mb-0 fr-py-1v"
                  estInline
                >
                  {`Liste des chantiers (${nombreTotalChantiersAvecAlertes})`}
                </Titre>
              </TitreInfobulleConteneur>
              <TableauChantiers
                chantiersSontArchives={chantiersSontArchives ?? false}
                données={donnéesTableauChantiers}
                jalon={jalon}
                ministèresDisponibles={ministères}
                nombreTotalChantiersAvecAlertes={
                  nombreTotalChantiersAvecAlertes
                }
                territoireCode={territoireCode}
              />
            </Bloc>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
};

export default PageChantiers;
