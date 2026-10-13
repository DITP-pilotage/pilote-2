import { Fragment, FunctionComponent, useMemo, useState } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { IndicateurDétails } from "@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails";
import { IndicateurPonderation } from "@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import IndicateurBlocIndicateurTuile from "@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile";
import { IndicateurTendance } from "@/components/_commons/IndicateurTendance/IndicateurTendance";
import { IndicateurPropositionValeur } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurPropositionValeur";
import { BlocIndicateurProvider } from "@/components/PageChantier/useBlocIndicateurContext";
import { LignesPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/LignesPropositionValeurAvancement";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { BadgeIndicateurEnAlerte } from "@/components/_commons/IndicateursChantier/Bloc/BadgeIndicateurEnAlerte";
import { BadgeIndicateurBarometre } from "@/components/_commons/IndicateursChantier/Bloc/BadgeIndicateurBarometre";
import { LigneIndicateurDatePrevisionnelle } from "@/components/_commons/IndicateursChantier/Bloc/LigneIndicateurDatePrevisionnelle";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { useIndicateurBloc } from "./useIndicateurBloc";
import { Table } from "@/components/shared/Table";

interface IndicateurBlocProps {
  indicateur: Indicateur;
  estAutoriseAProposerUneValeurAvancement: boolean;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
}

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  estAutoriseAProposerUneValeurAvancement,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
}) => {
  const {
    détailsIndicateurs,
    detailsIndicateursTerritoire,
    chantier,
    territoireCode,
    territoiresCompares,
    mailleQuery,
    jalon,
    cartographieDroiteIndicateur,
    cartographieGaucheIndicateur,
    datajobsExecution,
  } = pageChantier.useServerSidePropsContext();
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const mailsDirecteursProjets = chantier.responsables.directeursProjet
    .map((directeur) => directeur.email)
    .filter(Boolean);
  const [propositionEstVisible, setPropositionEstVisible] = useState(false);

  const détailTerritoireSélectionné = useTerritoireSelectionne();

  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue("sm");

  const detailTerritoiresCompares = useMemo(() => {
    return territoiresCompares.map(récupérerDétailsSurUnTerritoire);
  }, [récupérerDétailsSurUnTerritoire, territoiresCompares]);

  const detailsIndicateur = détailsIndicateurs[indicateur.id];

  const {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurAvancement,
    dateValeurAvancement,
  } = useIndicateurBloc(detailsIndicateur, territoireCode);

  const informationsIndicateursCompares = useMemo(() => {
    return detailTerritoiresCompares
      .map((territoireCompare) => ({
        territoireNom: territoireCompare.nomAffiché,
        territoireCode: territoireCompare.code,
        données: detailsIndicateur[territoireCompare.code],
      }))
      .sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) =>
        indicateurDétailsTerritoire1.données.codeInsee.localeCompare(
          indicateurDétailsTerritoire2.données.codeInsee,
        ),
      );
  }, [detailTerritoiresCompares, detailsIndicateur]);

  const getCalculAvancementMessage = (
    valeurInitiale: number | null,
    valeurAvancement: number | null,
    valeurCible: number | null,
    tauxAvancement: number | null,
    jalonAAfficher: number,
  ) => {
    if (
      valeurInitiale === null ||
      valeurAvancement === null ||
      valeurCible === null ||
      tauxAvancement === null
    ) {
      return (
        <span className="!text-sm">
          Le taux d'avancement n'est pas calculé car des données sont manquantes
          ou non applicables.
        </span>
      );
    }

    return (
      <>
        Il correspond au chemin parcouru depuis le point de départ (valeur
        initiale de l'indicateur) pour atteindre l'objectif fixé (valeur cible
        pour l'année <b>{jalonAAfficher}</b> ). Il est calculé selon la formule
        suivante (valeur d'avancement - valeur initiale) / (valeur cible -
        valeur initiale) soit (<b>{valeurAvancement}</b> -{" "}
        <b>{valeurInitiale}</b> ) / (<b>{valeurCible}</b> -{" "}
        <b>{valeurInitiale}</b> ) = <b>{tauxAvancement.toFixed(0)}</b> % . Pour
        plus d'informations, veuillez consulter le centre d'aide.
      </>
    );
  };

  let indicateurNomAvecUnite = `${indicateur.nom}${
    indicateur.unité === null || indicateur.unité === ""
      ? ""
      : ` (en ${indicateur.unité})`
  }`;

  const detailIndicateurDuTerritoire =
    détailsIndicateurs[indicateur.id][territoireCode];

  return (
    <BlocIndicateurProvider
      chantier={chantier}
      datajobsExecution={datajobsExecution}
      detailIndicateurDuTerritoire={detailIndicateurDuTerritoire}
      détailsIndicateurs={détailsIndicateurs}
      indicateur={indicateur}
      jalon={jalon}
      territoireCode={territoireCode}
      territoireSélectionné={détailTerritoireSélectionné}
    >
      <div className="mt-4 last-of-type:mb-0" key={indicateur.id}>
        <Bloc>
          <section>
            <div className="flex justify-between">
              <div>
                <h4 className="text-lead !mb-2 flex align-center">
                  <BadgeIndicateurEnAlerte />
                  <BadgeIndicateurBarometre />
                  {indicateurNomAvecUnite}
                </h4>
                <div className="fr-ml-2w fr-mb-3w">
                  <p className="fr-mb-0 fr-text--xs texte-gris">
                    Identifiant de l'indicateur :{" "}
                    <strong>{indicateur.id}</strong>
                  </p>
                  <p className="fr-mb-0 fr-text--xs texte-gris">
                    Dernière mise à jour de la valeur d'avancement pour le
                    territoire :{" "}
                    <span className="bold">
                      {dateDeMiseAJourIndicateur ?? "Non renseignée"}
                    </span>
                  </p>
                  <LigneIndicateurDatePrevisionnelle />
                  <IndicateurPonderation
                    indicateurPondération={
                      detailIndicateurDuTerritoire.ponderation ?? null
                    }
                    territoireCode={territoireCode}
                  />

                  <IndicateurPropositionValeur
                    estAutoriseAProposerUneValeurAvancement={
                      estAutoriseAProposerUneValeurAvancement
                    }
                    propositionEstVisible={propositionEstVisible}
                    setPropositionEstVisible={setPropositionEstVisible}
                  />
                  <IndicateurTendance
                    tendance={detailIndicateurDuTerritoire.tendance}
                  />
                </div>
              </div>
            </div>
            {estVueTuile ? (
              <IndicateurBlocIndicateurTuile />
            ) : (
              <Table.Root
                caption={`Tableau de l'indicateur : ${indicateur.nom}`}
                captionHidden
                className="w-full border-collapse"
                containerClassName="mb-0"
              >
                <Table.Header className="bg-transparent text-center">
                  <Table.Row>
                    <Table.Cell className="mb-0 p-2 pl-4 md:p-2 md:py-2 md:pl-4" />
                    <Table.Cell className="mb-0 !text-sm p-0 md:p-0 md:py-2" />
                    <Table.ColumnHeaderCell
                      className="bg-dsfr-contrast-grey border-b border-b-high-grey text-center mb-0 !text-sm bold p-0 md:p-0 md:py-2"
                      colSpan={3}
                    >
                      <div className="flex align-center justify-center">
                        <span className="pr-1">DONNÉES À ÉCHÉANCE {jalon}</span>
                      </div>
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                  <Table.Row className="border-b border-b-high-grey">
                    <Table.ColumnHeaderCell className="bg-dsfr-blue-france-925 text-center mb-0 !text-sm bold no-wrap px-2 md:py-2 md:px-2 border-b-0">
                      Territoire(s)
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="bg-dsfr-blue-france-925 text-center mb-0 !text-sm bold px-2 md:py-2 md:px-2 border-b-0">
                      valeur initiale
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="bg-dsfr-contrast-grey text-center mb-0 !text-sm bold px-2 md:py-2 md:px-2 border-b-0">
                      valeur d'avancement
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="bg-dsfr-contrast-grey text-center mb-0 !text-sm bold px-2 md:py-2 md:px-2 border-b-0">
                      valeur cible
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="bg-dsfr-contrast-grey text-center mb-0 !text-sm bold px-2 md:py-2 md:px-2 border-b-0">
                      taux d'avancement
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row key={détailTerritoireSélectionné.nomAffiché}>
                    <Table.RowHeaderCell className="mb-0 !text-sm bold text-primary min-h-8 align-top p-2 pl-4 md:p-2 md:py-2 md:pl-4">
                      {détailTerritoireSélectionné.nomAffiché}
                    </Table.RowHeaderCell>
                    <Table.Cell className="mb-0 !text-sm text-center min-h-8 align-top p-0 md:p-0 md:py-2">
                      <ValeurEtDate
                        date={detailIndicateurDuTerritoire.dateValeurInitiale}
                        unité={detailIndicateurDuTerritoire.unite}
                        valeur={detailIndicateurDuTerritoire.valeurInitiale}
                      />
                    </Table.Cell>
                    {/* Valeur et date valeur d'avancement de indicateurTerritoireJalon en fonction du jalon */}
                    <Table.Cell className="mb-0 !text-sm text-center min-h-8 align-top p-0 md:p-0 md:py-2">
                      <ValeurEtDate
                        date={detailIndicateurDuTerritoire.dateValeurAvancement}
                        unité={detailIndicateurDuTerritoire.unite}
                        valeur={detailIndicateurDuTerritoire.valeurAvancement}
                      />
                    </Table.Cell>
                    <Table.Cell className="mb-0 !text-sm text-center min-h-8 align-top p-0 md:p-0 md:py-2">
                      <ValeurEtDate
                        date={
                          detailIndicateurDuTerritoire.dateValeurCibleAnnuelle
                        }
                        unité={detailIndicateurDuTerritoire.unite}
                        valeur={
                          detailIndicateurDuTerritoire.valeurCibleAnnuelle
                        }
                      />
                    </Table.Cell>
                    <Table.Cell className="mb-0 !text-sm flex min-h-8 align-top p-0 px-4 md:p-0 md:py-2 md:px-4">
                      <BarreDeProgression
                        afficherTexte
                        fond="gris-clair"
                        positionTexte="dessus"
                        taille="md"
                        texteInfobulle={getCalculAvancementMessage(
                          detailIndicateurDuTerritoire.valeurInitiale,
                          detailIndicateurDuTerritoire.valeurAvancement,
                          detailIndicateurDuTerritoire.valeurCibleAnnuelle,
                          detailIndicateurDuTerritoire.avancement.annuel,
                          jalon,
                        )}
                        valeur={detailIndicateurDuTerritoire.avancement.annuel}
                        variante="secondaire"
                      />
                    </Table.Cell>
                  </Table.Row>
                  {détailTerritoireSélectionné.code === territoireCode ? (
                    !(
                      estAutoriseAProposerUneValeurAvancement &&
                      detailIndicateurDuTerritoire.valeurAvancementMandat !=
                        null &&
                      detailIndicateurDuTerritoire.proposition == null
                    ) ? (
                      <LignesPropositionValeurAvancement
                        estAutoriseAAccepterLesPropositionsDeValeurAvancement={
                          estAutoriseAAccepterLesPropositionsDeValeurAvancement
                        }
                        estAutoriseAProposerUneValeurAvancement={
                          estAutoriseAProposerUneValeurAvancement
                        }
                        propositionEstVisible={propositionEstVisible}
                      />
                    ) : null
                  ) : null}
                  {informationsIndicateursCompares.map(
                    (informationIndicateurComparé) => {
                      return informationIndicateurComparé.données ? ( // TODO supprimer une fois le refacto fait ! A cause de la react query y'a quelques frames où informationIndicateurComparé.données est undefined
                        <Fragment
                          key={informationIndicateurComparé.territoireNom}
                        >
                          <Table.Row
                            className="border-t border-t-dsfr-grey-625 bg-transparent"
                            key={informationIndicateurComparé.territoireNom}
                          >
                            <Table.RowHeaderCell className="mb-0 !text-sm text-dsfr-flat-info min-h-8 align-top p-2 pl-4 md:p-2 md:py-2 md:pl-4">
                              {informationIndicateurComparé.territoireNom}
                            </Table.RowHeaderCell>
                            <Table.Cell className="mb-0 !text-sm text-center min-h-8 align-top p-0 md:p-0 md:py-2">
                              <ValeurEtDate
                                date={
                                  informationIndicateurComparé.données
                                    .dateValeurInitiale
                                }
                                unité={
                                  informationIndicateurComparé.données.unite
                                }
                                valeur={
                                  informationIndicateurComparé.données
                                    .valeurInitiale
                                }
                              />
                            </Table.Cell>
                            <Table.Cell className="mb-0 !text-sm text-center min-h-8 align-top p-0 md:p-0 md:py-2">
                              <ValeurEtDate
                                date={
                                  informationIndicateurComparé.données
                                    .dateValeurAvancement
                                }
                                unité={
                                  informationIndicateurComparé.données.unite
                                }
                                valeur={
                                  informationIndicateurComparé.données
                                    .valeurAvancement
                                }
                              />
                            </Table.Cell>
                            <Table.Cell className="mb-0 !text-sm text-center min-h-8 align-top p-0 md:p-0 md:py-2">
                              <ValeurEtDate
                                date={
                                  informationIndicateurComparé.données
                                    .dateValeurCibleAnnuelle
                                }
                                unité={
                                  informationIndicateurComparé.données.unite
                                }
                                valeur={
                                  informationIndicateurComparé.données
                                    .valeurCibleAnnuelle
                                }
                              />
                            </Table.Cell>
                            <Table.Cell className="mb-0 !text-sm min-h-8 align-top p-0 px-4 md:p-0 md:py-2 md:px-4">
                              <BarreDeProgression
                                afficherTexte
                                fond="gris-clair"
                                positionTexte="dessus"
                                taille="md"
                                valeur={
                                  informationIndicateurComparé.données
                                    .avancement.annuel
                                }
                                variante="secondaire-light"
                              />
                            </Table.Cell>
                          </Table.Row>
                        </Fragment>
                      ) : null;
                    },
                  )}
                </Table.Body>
              </Table.Root>
            )}
            <IndicateurDétails
              cartographieDroiteIndicateur={cartographieDroiteIndicateur}
              cartographieGaucheIndicateur={cartographieGaucheIndicateur}
              dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
              dateProchaineDateMaj={dateProchaineDateMaj}
              dateProchaineDateValeurAvancement={
                dateProchaineDateValeurAvancement
              }
              dateValeurAvancement={dateValeurAvancement}
              detailsIndicateursTerritoire={detailsIndicateursTerritoire}
              indicateurDétailsParTerritoiresComparés={
                informationsIndicateursCompares
              }
              mailleQuery={mailleQuery}
              mailsDirecteursProjets={mailsDirecteursProjets}
            />
          </section>
        </Bloc>
      </div>
    </BlocIndicateurProvider>
  );
};

export default IndicateurBloc;
