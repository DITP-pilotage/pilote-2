import { Fragment, FunctionComponent, useMemo, useState } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import { IndicateurDétails } from "@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails";
import { IndicateurPonderation } from "@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation";
import "@gouvfr/dsfr/dist/component/table/table.min.css";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import IndicateurBlocIndicateurTuile from "@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile";
import { IndicateurTendance } from "@/components/_commons/IndicateurTendance/IndicateurTendance";
import { IndicateurPropositionValeur } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurPropositionValeur";
import { BlocIndicateurProvider } from "@/components/PageChantier/useBlocIndicateurContext";
import { LignesPropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/LignesPropositionValeurAvancementV2";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { BadgeIndicateurEnAlerte } from "@/components/_commons/IndicateursChantier/Bloc/BadgeIndicateurEnAlerte";
import { BadgeIndicateurBarometre } from "@/components/_commons/IndicateursChantier/Bloc/BadgeIndicateurBarometre";
import { LigneIndicateurDatePrevisionnelle } from "@/components/_commons/IndicateursChantier/Bloc/LigneIndicateurDatePrevisionnelle";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { useIndicateurBloc } from "./useIndicateurBloc";

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
    configurationFeatureFlipping,
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
      configurationFeatureFlipping={configurationFeatureFlipping}
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
                <Titre
                  baliseHtml="h4"
                  className="fr-text--xl !mb-2 flex align-center"
                >
                  <BadgeIndicateurEnAlerte />
                  <BadgeIndicateurBarometre />
                  {indicateurNomAvecUnite}
                </Titre>
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
              <table className="fr-table w-full border-collapse fr-mb-0">
                <caption className="fr-sr-only">
                  Un tableau de l'indicateur :'
                </caption>
                <thead className="fr-background-transparent text-center">
                  <tr>
                    <th className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w" />
                    <th className="fr-mb-0 fr-p-0 fr-py-md-1w !text-sm" />
                    <th
                      className="fr-background-contrast-grey border-b border-b-high-grey text-center fr-mb-0 fr-p-0 fr-py-md-1w !text-sm bold"
                      colSpan={3}
                    >
                      <div className="flex align-center justify-center">
                        <span className="fr-pr-1v">
                          DONNÉES À ÉCHÉANCE {jalon}
                        </span>
                      </div>
                    </th>
                  </tr>
                  <tr className="border-b border-b-high-grey">
                    <th className="fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w !text-sm bold no-wrap">
                      Territoire(s)
                    </th>
                    <th className="fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w !text-sm bold">
                      valeur initiale
                    </th>
                    <th className="fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w !text-sm bold">
                      valeur d'avancement
                    </th>
                    <th className="fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w !text-sm bold">
                      valeur cible
                    </th>
                    <th className="fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w !text-sm bold">
                      taux d'avancement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-none">
                  <tr
                    className="bg-transparent"
                    key={détailTerritoireSélectionné.nomAffiché}
                  >
                    <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w !text-sm bold text-primary min-h-8 align-top">
                      {détailTerritoireSélectionné.nomAffiché}
                    </td>
                    <td className="fr-mb-0 fr-p-0 fr-py-md-1w !text-sm text-center min-h-8 align-top">
                      <ValeurEtDate
                        date={detailIndicateurDuTerritoire.dateValeurInitiale}
                        unité={detailIndicateurDuTerritoire.unite}
                        valeur={detailIndicateurDuTerritoire.valeurInitiale}
                      />
                    </td>
                    {/* Valeur et date valeur d'avancement de indicateurTerritoireJalon en fonction du jalon */}
                    <td className="fr-mb-0 fr-p-0 fr-py-md-1w !text-sm text-center min-h-8 align-top">
                      <ValeurEtDate
                        date={detailIndicateurDuTerritoire.dateValeurAvancement}
                        unité={detailIndicateurDuTerritoire.unite}
                        valeur={detailIndicateurDuTerritoire.valeurAvancement}
                      />
                    </td>
                    <td className="fr-mb-0 fr-p-0 fr-py-md-1w !text-sm text-center min-h-8 align-top">
                      <ValeurEtDate
                        date={
                          detailIndicateurDuTerritoire.dateValeurCibleAnnuelle
                        }
                        unité={detailIndicateurDuTerritoire.unite}
                        valeur={
                          detailIndicateurDuTerritoire.valeurCibleAnnuelle
                        }
                      />
                    </td>
                    <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w !text-sm flex min-h-8 align-top">
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
                    </td>
                  </tr>
                  {détailTerritoireSélectionné.code === territoireCode ? (
                    !(
                      estAutoriseAProposerUneValeurAvancement &&
                      detailIndicateurDuTerritoire.valeurAvancementMandat !=
                        null &&
                      detailIndicateurDuTerritoire.proposition == null
                    ) ? (
                      <LignesPropositionValeurAvancementV2
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
                          <tr
                            className="border-t border-t-dsfr-grey-625 bg-transparent"
                            key={informationIndicateurComparé.territoireNom}
                          >
                            <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w !text-sm fr-text-title--light-blue-france min-h-8 align-top">
                              {informationIndicateurComparé.territoireNom}
                            </td>
                            <td className="fr-mb-0 fr-p-0 fr-py-md-1w !text-sm text-center min-h-8 align-top">
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
                            </td>
                            <td className="fr-mb-0 fr-p-0 fr-py-md-1w !text-sm text-center min-h-8 align-top">
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
                            </td>
                            <td className="fr-mb-0 fr-p-0 fr-py-md-1w !text-sm text-center min-h-8 align-top">
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
                            </td>
                            <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w !text-sm min-h-8 align-top">
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
                            </td>
                          </tr>
                        </Fragment>
                      ) : null;
                    },
                  )}
                </tbody>
              </table>
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
