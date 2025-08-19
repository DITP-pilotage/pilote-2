import { Fragment, FunctionComponent, useState } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import PictoBaromètre from "@/components/_commons/PictoBaromètre/PictoBaromètre";
import IndicateurDétails, {
  CartographieIndicateurType,
} from "@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails";
import { actionsTerritoiresStore } from "@/client/stores/useTerritoiresStore/useTerritoiresStore";
import IndicateurPonderation from "@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation";
import BadgeIcône from "@/components/_commons/BadgeIcône/BadgeIcône";
import api from "@/server/infrastructure/api/trpc/api";
import "@gouvfr/dsfr/dist/component/table/table.min.css";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import IndicateurBlocIndicateurTuile from "@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile";
import { ModalePropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancement/ModalePropositionValeurAvancement";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { formaterDate } from "@/client/utils/date/date";
import IndicateurTendance from "@/components/_commons/IndicateursChantier/Bloc/Tendances/IndicateurTendance";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { ModaleSuppressionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancement/ModaleSuppressionValeurAvancement";
import BoutonSousLigné from "@/client/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { DetailsIndicateursContrat } from "@/server/chantiers/app/contrats/DetailsIndicateursContrat";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import IndicateurBlocStyled from "./IndicateurBloc.styled";
import useIndicateurBloc from "./useIndicateurBloc";
import useIndicateurAlerteDateMaj from "./useIndicateurAlerteDateMaj";
import { ModalePropositionValeurAvancementV2 } from "./ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";
import { ModaleAccepterPropositionValeurAvancement } from "./ModaleAccepterPropositionValeurAvancement/ModaleAccepterPropositionValeurAvancement";
import { ModaleSuppressionValeurAvancementV2 } from "./ModaleSuppressionValeurAvancementV2/ModaleSuppressionValeurAvancementV2";
import { ModaleAccuserReceptionPropositionValeurAvancement } from "./ModaleAccuserReceptionPropositionValeurAvancement/ModaleAccuserReceptionPropositionValeurAvancement";

export const ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT =
  "modale-suppression-valeur-davancement";
export const ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT =
  "modale-proposition-valeur-davancement";
export const ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT =
  "modale-accepter-proposition-valeur-davancement";
export const ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT =
  "modale-accuser-reception-proposition-valeur-davancement";

interface IndicateurBlocProps {
  indicateur: Indicateur;
  détailsIndicateurs: DetailsIndicateursContrat;
  detailsIndicateursTerritoire: DetailsIndicateursContrat;
  estInteractif: boolean;
  chantierEstTerritorialisé: boolean;
  estAutoriseAProposerUneValeurAvancement: boolean;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  listeSousIndicateurs: Indicateur[];
  territoireCode: string;
  territoiresCompares: string[];
  mailleSelectionnee: MailleInterne;
  mailleQuery: MailleInterne;
  mailsDirecteursProjets: string[];
  jalon: number;
  cartographieDroiteIndicateur: CartographieIndicateurType;
  cartographieGaucheIndicateur: CartographieIndicateurType;
  nouveauxGraphiquesSontActifs: boolean;
}

// TODO(CHAN) : faire le refuser + supprimer (et cleaner le composant)
const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  chantierEstTerritorialisé,
  estAutoriseAProposerUneValeurAvancement:
    estAutoriseAProposerUneValeurAvancement = false,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement:
    estAutoriseAAccepterLesPropositionsDeValeurAvancement = false,
  listeSousIndicateurs,
  territoireCode,
  territoiresCompares,
  mailleSelectionnee,
  mailleQuery,
  mailsDirecteursProjets,
  jalon,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
  nouveauxGraphiquesSontActifs,
}) => {
  const [propositionEstVisible, setPropositionEstVisible] = useState(false);
  const { maille: mailleTerritoireSelectionnee } =
    territoireCodeVersMailleCodeInsee(territoireCode);
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue("sm");
  const detailTerritoiresCompares = territoiresCompares.map(
    récupérerDétailsSurUnTerritoire,
  );

  const détailTerritoireSélectionné =
    récupérerDétailsSurUnTerritoire(territoireCode);

  const detailsIndicateur = détailsIndicateurs[indicateur.id];
  const estAccuseReception =
    detailsIndicateur[territoireCode].propositionStatutDirectionProjet
      ?.statut === "PROPOSITION_VALEUR_ACCUSEE_RECEPTION";
  const estModifiee =
    detailsIndicateur[territoireCode].propositionStatutTerritoire?.statut ===
    "PROPOSITION_VALEUR_MODIFIEE";

  const { data: variableContenuFFPropositionValeurAvancement } =
    api.gestionContenu.récupérerVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE",
    });

  const { data: variableContenuFFPropositionValeurAvancementV2 } =
    api.gestionContenu.récupérerVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE_V2",
    });

  const {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurAvancement,
    dateValeurAvancement,
    indicateurNonAJour,
    indicateurEstApplicable,
  } = useIndicateurBloc(detailsIndicateur, territoireCode);

  const informationsIndicateurs = [
    {
      territoireNom: détailTerritoireSélectionné.nomAffiché,
      code: détailTerritoireSélectionné.code,
      données: detailsIndicateur[territoireCode],
    },
  ];

  const informationsIndicateursComparés = detailTerritoiresCompares
    .map((territoireCompare) => ({
      territoireNom: territoireCompare.nomAffiché,
      code: territoireCompare.code,
      données: detailsIndicateur[territoireCompare.code],
    }))
    .sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) =>
      indicateurDétailsTerritoire1.données.codeInsee.localeCompare(
        indicateurDétailsTerritoire2.données.codeInsee,
      ),
    );

  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(
    indicateurNonAJour,
    indicateurEstApplicable,
  );

  const estPropositionSurLeBonJalon =
    detailsIndicateur[territoireCode].dateValeurAvancementMandat !== null
      ? new Date(
          detailsIndicateur[territoireCode].dateValeurAvancementMandat!,
        ).getFullYear() <= jalon
      : false;
  const propositionSurMailleDesactivee =
    indicateur.mailleRegAgregee && mailleSelectionnee == "regionale";

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
        <span className="fr-text--sm">
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

  return (
    <IndicateurBlocStyled className="fr-mt-2w" key={indicateur.id}>
      <Bloc>
        <section>
          <div className="flex justify-between">
            <div>
              <Titre baliseHtml="h4" className="fr-text--xl fr-mb-1w">
                {estIndicateurEnAlerte ? (
                  <span className="fr-mr-1v">
                    <BadgeIcône type="warning" />
                  </span>
                ) : null}
                {indicateur.estIndicateurDuBaromètre ? (
                  <span className="fr-mr-1v">
                    <PictoBaromètre />
                  </span>
                ) : null}
                {indicateur.nom +
                  (indicateur.unité === null || indicateur.unité === ""
                    ? ""
                    : ` (en ${indicateur.unité})`)}
              </Titre>
              <div className="fr-ml-2w fr-mb-3w">
                <p className="fr-mb-0 fr-text--xs texte-gris">
                  Identifiant de l'indicateur : <strong>{indicateur.id}</strong>
                </p>
                <p className="fr-mb-0 fr-text--xs texte-gris">
                  Dernière mise à jour des données (de l'indicateur, toutes
                  zones confondues) :{" "}
                  <span className="fr-text--bold">
                    {dateDeMiseAJourIndicateur ?? "Non renseignée"}
                  </span>
                </p>
                <div
                  className={`flex align-center w-full relative${estIndicateurEnAlerte ? " fr-text-warning" : " texte-gris"}`}
                >
                  <p className="fr-mb-0 fr-text--xs">
                    Date prévisionnelle de la prochaine mise à jour des données
                    (de l'indicateur) :{" "}
                    <span className="fr-text--bold">
                      {indicateurEstApplicable
                        ? (dateProchaineDateMaj ??
                          "Données requises mais non renseignées par l'équipe projet")
                        : "Non applicable"}
                    </span>
                  </p>
                  <Infobulle
                    classNameBouton="infobulle-date-previsionnelle"
                    classNameInfoBulle="tooltip-accordeon"
                    idHtml={`infobulle-date-previsionnelle-${indicateur.id}`}
                  >
                    <p className="fr-text--sm fr-text-title--blue-france">
                      Date prévisionnelle de mise à jour de l'indicateur :
                    </p>
                    <p className="fr-text--sm fr-mb-0">
                      Elle est calculée à partir de la date de la valeur
                      d'avancement, de la période de mise à jour et du délai de
                      disponibilité des données. Plus d'informations dans
                      l'accordéon "Description de l'indicateur et calendrier de
                      mise à jour".
                    </p>
                  </Infobulle>
                </div>
                <IndicateurPonderation
                  indicateurPondération={
                    detailsIndicateur[territoireCode]?.pondération ?? null
                  }
                  mailleSélectionnée={mailleTerritoireSelectionnee}
                />
                {variableContenuFFPropositionValeurAvancementV2 &&
                (estAutoriseAProposerUneValeurAvancement ||
                  estAutoriseAAccepterLesPropositionsDeValeurAvancement) ? (
                  <div>
                    {informationsIndicateurs[0].données.proposition === null ? (
                      <div className="flex flex-align-center">
                        <p className="fr-text--xs texte-gris fr-mb-0">
                          Aucune proposition pour la valeur d'avancement de cet
                          indicateur
                        </p>
                        <BoutonSousLigné
                          ariaControls={
                            ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                            indicateur.id
                          }
                          classNameSupplémentaires="fr-link--xs fr-link--icon-left fr-icon-edit-line fr-ml-2w texte-gris"
                          dataFrOpened={false}
                          type="button"
                        >
                          Proposer une autre valeur d'avancement
                        </BoutonSousLigné>
                      </div>
                    ) : (
                      <>
                        <p className="fr-text--xs texte-jaune fr-mb-0">
                          <strong>
                            Proposition de nouvelle valeur d'avancement en cours
                          </strong>{" "}
                          – {estModifiee ? "modifiée" : "présentée"} par le
                          territoire le{" "}
                          <strong>
                            {formaterDate(
                              informationsIndicateurs[0].données.proposition
                                .dateProposition,
                              "DD/MM/YYYY",
                            )}
                          </strong>{" "}
                          et{" "}
                          {estAccuseReception ? "lue" : "en attente de lecture"}{" "}
                          par la direction de projet
                        </p>
                        <BoutonSousLigné
                          classNameSupplémentaires={`fr-link--xs fr-link--icon-left ${propositionEstVisible ? "fr-icon-eye-off-line" : "fr-icon-eye-line"} texte-jaune `}
                          dataFrOpened={false}
                          onClick={() =>
                            setPropositionEstVisible(!propositionEstVisible)
                          }
                          type="button"
                        >
                          {propositionEstVisible
                            ? "Masquer la proposition"
                            : "Afficher la proposition"}
                        </BoutonSousLigné>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
              {detailsIndicateur[territoireCode]?.tendance === "BAISSE" ? (
                <IndicateurTendance />
              ) : null}
            </div>
          </div>
          {estVueTuile ? (
            informationsIndicateurs.map((informationIndicateur) => (
              <Fragment key={informationIndicateur.territoireNom}>
                <IndicateurBlocIndicateurTuile
                  indicateurDétailsParTerritoire={informationIndicateur}
                  typeDeRéforme="chantier"
                  unité={informationIndicateur.données.unité}
                />
              </Fragment>
            ))
          ) : (
            <table className="fr-table w-full border-collapse fr-mb-0">
              <caption className="fr-sr-only">
                Un tableau de l'indicateur :'
              </caption>
              <thead className="fr-background-transparent text-center">
                <tr>
                  <th className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w" />
                  <th className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm" />
                  <th
                    className="fr-background-contrast-grey border-b-2 border-b-high-grey text-center fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold"
                    colSpan={3}
                  >
                    <div className="flex align-center justify-center">
                      <span className="fr-pr-1v">
                        DONNÉES À ÉCHÉANCE {jalon}
                      </span>
                    </div>
                  </th>
                  <th
                    className="fr-background-action-low-blue-france border-b-2 border-b-high-grey text-center fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold"
                    colSpan={3}
                  >
                    DONNÉES À ÉCHÉANCE 2026
                  </th>
                </tr>
                <tr className="border-b-2 border-b-high-grey">
                  <th className="fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold no-wrap">
                    Territoire(s)
                  </th>
                  <th className="fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold">
                    valeur initiale
                  </th>
                  <th className="fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold">
                    valeur d'avancement
                  </th>
                  <th className="fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold">
                    valeur cible
                  </th>
                  <th className="fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold">
                    taux d'avancement
                  </th>
                  <th className="fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold">
                    valeur d'avancement
                  </th>
                  <th className="fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold">
                    valeur cible
                  </th>
                  <th className="fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold">
                    taux d'avancement
                  </th>
                </tr>
              </thead>
              <tbody>
                {informationsIndicateurs.map((informationIndicateur) => {
                  return informationIndicateur.données ? ( // TODO supprimer une fois le refacto fait ! A cause de la react query y'a quelques frames où informationIndicateur.données est undefined
                    <Fragment key={informationIndicateur.territoireNom}>
                      <tr
                        className={`${informationIndicateur.code === territoireCode ? "ligne-territoire-proposition-valeur-davancement" : null}`}
                        key={informationIndicateur.territoireNom}
                      >
                        <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold fr-text-title--high-blue-france">
                          {informationIndicateur.territoireNom}
                        </td>
                        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                          <ValeurEtDate
                            date={
                              informationIndicateur.données.dateValeurInitiale
                            }
                            unité={informationIndicateur.données.unité}
                            valeur={
                              informationIndicateur.données.valeurInitiale
                            }
                          />
                        </td>
                        {/* Valeur et date valeur d'avancement de indicateurTerritoireJalon en fonction du jalon */}
                        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                          <ValeurEtDate
                            date={
                              informationIndicateur.données.dateValeurAvancement
                            }
                            unité={informationIndicateur.données.unité}
                            valeur={
                              informationIndicateur.données.valeurAvancement
                            }
                          />
                        </td>
                        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                          <ValeurEtDate
                            date={
                              informationIndicateur.données
                                .dateValeurCibleAnnuelle
                            }
                            unité={informationIndicateur.données.unité}
                            valeur={
                              informationIndicateur.données.valeurCibleAnnuelle
                            }
                          />
                        </td>
                        <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm flex">
                          <BarreDeProgression
                            afficherTexte
                            fond="gris-clair"
                            infobulleId={`infobulle-taux-avancement-jalon-${informationIndicateur.code}`}
                            positionTexte="dessus"
                            taille="md"
                            texteInfobulle={getCalculAvancementMessage(
                              informationIndicateur.données.valeurInitiale,
                              informationIndicateur.données.valeurAvancement,
                              informationIndicateur.données.valeurCibleAnnuelle,
                              informationIndicateur.données.avancement.annuel,
                              jalon,
                            )}
                            valeur={
                              informationIndicateur.données.avancement.annuel
                            }
                            variante="secondaire"
                          />
                        </td>
                        {/* Valeur et date valeur d'avancement mandat de indicateurTerritoire */}
                        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                          <ValeurEtDate
                            date={
                              informationIndicateur.données
                                .dateValeurAvancementMandat
                            }
                            unité={informationIndicateur.données.unité}
                            valeur={
                              informationIndicateur.données
                                .valeurAvancementMandat
                            }
                          />
                        </td>
                        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                          <ValeurEtDate
                            date={informationIndicateur.données.dateValeurCible}
                            unité={informationIndicateur.données.unité}
                            valeur={informationIndicateur.données.valeurCible}
                          />
                        </td>
                        <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm">
                          <BarreDeProgression
                            afficherTexte
                            fond="gris-clair"
                            infobulleId={`infobulle-taux-avancement-global-${informationIndicateur.code}`}
                            positionTexte="dessus"
                            taille="md"
                            texteInfobulle={getCalculAvancementMessage(
                              informationIndicateur.données.valeurInitiale,
                              informationIndicateur.données
                                .valeurAvancementMandat,
                              informationIndicateur.données.valeurCible,
                              informationIndicateur.données.avancement.global,
                              2026,
                            )}
                            valeur={
                              informationIndicateur.données.avancement.global
                            }
                            variante="primaire"
                          />
                        </td>
                      </tr>
                      {informationIndicateur.code === territoireCode ? (
                        variableContenuFFPropositionValeurAvancement ? (
                          estAutoriseAProposerUneValeurAvancement &&
                          informationIndicateur.données.valeurAvancement !==
                            null &&
                          informationIndicateur.données.proposition === null ? (
                            <tr className="ligne-creation-proposition-valeur-davancement">
                              <td colSpan={8}>
                                {!variableContenuFFPropositionValeurAvancementV2 ? (
                                  <div className="flex w-full justify-end">
                                    {propositionSurMailleDesactivee ? (
                                      <Infobulle
                                        classNameInfoBulle="tooltip-accordeon"
                                        idHtml={`infobulle-proposition-desactivee-${indicateur.id}`}
                                      >
                                        <p className="fr-text--sm">
                                          Les résultats de cet indicateur sont
                                          agrégés depuis le niveau
                                          départemental. Il n'est donc pas
                                          possible de proposer une valeur à une
                                          autre maille. Vous pouvez, soit
                                          proposer une valeur directement au
                                          niveau d'un département ou contacter
                                          directement le directeur de projet via
                                          l'onglet Responsables.
                                        </p>
                                      </Infobulle>
                                    ) : null}
                                    <button
                                      aria-controls={
                                        ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                                        indicateur.id
                                      }
                                      className="fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-davancement"
                                      data-fr-opened="false"
                                      disabled={propositionSurMailleDesactivee}
                                      type="button"
                                    >
                                      Proposer une autre valeur d'avancement
                                    </button>
                                  </div>
                                ) : null}
                                {!variableContenuFFPropositionValeurAvancementV2 ? (
                                  <ModalePropositionValeurAvancement
                                    detailIndicateur={
                                      informationIndicateur.données
                                    }
                                    generatedHTMLID={
                                      ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                                      indicateur.id
                                    }
                                    indicateur={indicateur}
                                    territoireCode={territoireCode}
                                    territoireCodeInsee={
                                      détailTerritoireSélectionné.codeInsee
                                    }
                                    territoireNom={
                                      détailTerritoireSélectionné.nom
                                    }
                                  />
                                ) : (
                                  <ModalePropositionValeurAvancementV2
                                    detailIndicateur={
                                      informationIndicateur.données
                                    }
                                    generatedHTMLID={
                                      ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                                      indicateur.id
                                    }
                                    indicateur={indicateur}
                                    territoireCode={territoireCode}
                                    territoireCodeInsee={
                                      détailTerritoireSélectionné.codeInsee
                                    }
                                    territoireNom={
                                      détailTerritoireSélectionné.nom
                                    }
                                  />
                                )}
                              </td>
                            </tr>
                          ) : informationIndicateur.données.proposition !==
                              null &&
                            (propositionEstVisible ||
                              !variableContenuFFPropositionValeurAvancementV2) ? (
                            <>
                              <tr
                                className="ligne-modification-proposition-valeur-davancement"
                                key={informationIndicateur.territoireNom}
                              >
                                <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm">
                                  <div className="flex align-center selecteur-infobulle-conteneur">
                                    <span className="texte-proposition">
                                      {variableContenuFFPropositionValeurAvancementV2
                                        ? "Proposition en cours"
                                        : "Proposition du territoire"}
                                    </span>
                                    <Infobulle
                                      classNameBouton="texte-proposition"
                                      classNameInfoBulle="tooltip-accordeon"
                                      idHtml={`infobulle-proposition-valeur-davancement-${informationIndicateur.code}`}
                                      styleIconInfoBulle="informationProposition"
                                    >
                                      <p className="fr-text--sm texte-proposition">
                                        Valeur d'avancement proposée le{" "}
                                        {formaterDate(
                                          informationIndicateur.données
                                            .proposition.dateProposition,
                                          "DD/MM/YYYY",
                                        )}{" "}
                                        par{" "}
                                        {
                                          informationIndicateur.données
                                            .proposition.auteur
                                        }
                                      </p>
                                      <p className="fr-text--sm">
                                        <b>Motif de la proposition</b>
                                      </p>
                                      <p className="fr-text--sm">
                                        {
                                          informationIndicateur.données
                                            .proposition.motif
                                        }
                                      </p>
                                      <p className="fr-text--sm">
                                        <b>
                                          Source des données et méthode de
                                          calcul
                                        </b>
                                      </p>
                                      <p className="fr-text--sm fr-mb-0">
                                        {
                                          informationIndicateur.données
                                            .proposition
                                            .sourceDonneeEtMethodeCalcul
                                        }
                                      </p>
                                    </Infobulle>
                                  </div>
                                  {variableContenuFFPropositionValeurAvancementV2 ? (
                                    <div className="flex align-center selecteur-infobulle-conteneur">
                                      {estAccuseReception ? (
                                        <>
                                          <span className="fr-text--xs texte-gris">
                                            la direction de projet a accusé
                                            réception
                                          </span>
                                          <Infobulle
                                            classNameBouton="texte-gris"
                                            classNameInfoBulle="tooltip-accordeon"
                                            idHtml={`infobulle-proposition-valeur-davancement-accusee-reception-${informationIndicateur.code}`}
                                          >
                                            <p className="fr-text--sm">
                                              Vous ne pouvez plus intervenir sur
                                              cet indicateur tant que la
                                              direction de projet n'aura pas
                                              pris une décision (accepter,
                                              accepter avec modification ou
                                              refuser) ou procédé à un nouvel
                                              import de données.
                                            </p>
                                          </Infobulle>
                                        </>
                                      ) : (
                                        <>
                                          <span className="fr-text--xs texte-gris">
                                            En attente de lecture par la
                                            direction de projet
                                          </span>
                                          <Infobulle
                                            classNameBouton="texte-gris"
                                            classNameInfoBulle="tooltip-accordeon"
                                            idHtml={`infobulle-proposition-valeur-davancement-statut-${informationIndicateur.code}`}
                                          >
                                            <p className="fr-text--sm">
                                              La direction de projet n'a pas
                                              encore accusé réception de votre
                                              proposition. Il vous est toujours
                                              possible de modifier ou de
                                              supprimer celle-ci si vous le
                                              souhaitez.
                                            </p>
                                          </Infobulle>
                                        </>
                                      )}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                                  <ValeurEtDate
                                    date={
                                      informationIndicateur.données
                                        .dateValeurInitiale
                                    }
                                    unité={informationIndicateur.données.unité}
                                    valeur={
                                      informationIndicateur.données
                                        .valeurInitiale
                                    }
                                  />
                                </td>
                                {estPropositionSurLeBonJalon ? (
                                  <>
                                    {/* Valeur d'avancement en fonction de la proposition du jalon et date valeur d'avancement en fonction du mandat */}
                                    <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm texte-proposition text-center">
                                      <ValeurEtDate
                                        date={
                                          informationIndicateur.données
                                            .dateValeurAvancementMandat
                                        }
                                        unité={
                                          informationIndicateur.données.unité
                                        }
                                        valeur={
                                          informationIndicateur.données
                                            .proposition.valeurAvancement
                                        }
                                      />
                                    </td>
                                    <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                                      <ValeurEtDate
                                        date={
                                          informationIndicateur.données
                                            .dateValeurCibleAnnuelle
                                        }
                                        unité={
                                          informationIndicateur.données.unité
                                        }
                                        valeur={
                                          informationIndicateur.données
                                            .valeurCibleAnnuelle
                                        }
                                      />
                                    </td>
                                    <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition">
                                      <BarreDeProgression
                                        afficherTexte
                                        fond="gris-clair"
                                        infobulleId={`infobulle-taux-avancement-proposition-jalon-${informationIndicateur.code}`}
                                        positionTexte="dessus"
                                        taille="md"
                                        valeur={
                                          informationIndicateur.données
                                            .proposition
                                            .tauxAvancementIntermediaire
                                        }
                                        variante="jaune-moutarde"
                                      />
                                    </td>
                                  </>
                                ) : (
                                  <td colSpan={3} />
                                )}
                                {/* Valeur d'avancement en fonction de la proposition du jalon et date valeur d'avancement en fonction du mandat */}
                                <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm texte-proposition text-center">
                                  <ValeurEtDate
                                    date={
                                      informationIndicateur.données
                                        .dateValeurAvancementMandat
                                    }
                                    unité={informationIndicateur.données.unité}
                                    valeur={
                                      informationIndicateur.données.proposition
                                        .valeurAvancement
                                    }
                                  />
                                </td>
                                <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                                  <ValeurEtDate
                                    date={
                                      informationIndicateur.données
                                        .dateValeurCible
                                    }
                                    unité={informationIndicateur.données.unité}
                                    valeur={
                                      informationIndicateur.données.valeurCible
                                    }
                                  />
                                </td>
                                <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition">
                                  <BarreDeProgression
                                    afficherTexte
                                    fond="gris-clair"
                                    infobulleId={`infobulle-taux-avancement-proposition-global-${informationIndicateur.code}`}
                                    positionTexte="dessus"
                                    taille="md"
                                    valeur={
                                      informationIndicateur.données.proposition
                                        .tauxAvancement
                                    }
                                    variante="jaune-moutarde"
                                  />
                                </td>
                              </tr>
                              {!variableContenuFFPropositionValeurAvancementV2 ? (
                                <tr className="ligne-modification-proposition-valeur-davancement">
                                  {estAutoriseAProposerUneValeurAvancement ? (
                                    <td colSpan={8}>
                                      <div className="flex w-full justify-end">
                                        <button
                                          aria-controls={
                                            ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                                            indicateur.id
                                          }
                                          className="fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-davancement fr-mr-1w"
                                          data-fr-opened="false"
                                          type="button"
                                        >
                                          Modifier la proposition
                                        </button>
                                        <button
                                          aria-controls={
                                            ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT +
                                            indicateur.id
                                          }
                                          className="fr-btn fr-btn--icon-left fr-icon-delete-line fr-btn--secondary bouton-proposition-valeur-davancement"
                                          data-fr-opened="false"
                                          type="button"
                                        >
                                          Supprimer la proposition
                                        </button>
                                      </div>
                                      <ModalePropositionValeurAvancement
                                        detailIndicateur={
                                          informationIndicateur.données
                                        }
                                        generatedHTMLID={
                                          ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                                          indicateur.id
                                        }
                                        indicateur={indicateur}
                                        territoireCode={territoireCode}
                                        territoireCodeInsee={
                                          détailTerritoireSélectionné.codeInsee
                                        }
                                        territoireNom={
                                          détailTerritoireSélectionné.nom
                                        }
                                      />
                                      <ModaleSuppressionValeurAvancement
                                        generatedHTMLID={
                                          ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT +
                                          indicateur.id
                                        }
                                        indicateur={indicateur}
                                        territoireCode={territoireCode}
                                      />
                                    </td>
                                  ) : null}
                                </tr>
                              ) : propositionEstVisible &&
                                estAutoriseAAccepterLesPropositionsDeValeurAvancement ? (
                                <tr className="ligne-modification-proposition-valeur-davancement">
                                  <td colSpan={8}>
                                    <div className="flex w-full align-center justify-end gap-4">
                                      {!estAccuseReception && (
                                        <BoutonSousLigné
                                          ariaControls={
                                            ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT +
                                            indicateur.id
                                          }
                                          classNameSupplémentaires="fr-link--icon-left fr-icon-mail-line texte-jaune"
                                          dataFrOpened={false}
                                          type="button"
                                        >
                                          Accuser réception
                                        </BoutonSousLigné>
                                      )}
                                      <button
                                        aria-controls={
                                          ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT +
                                          indicateur.id
                                        }
                                        className="fr-btn fr-btn--icon-left fr-icon-scales-3-fill fr-btn--secondary bouton-proposition-valeur-davancement"
                                        data-fr-opened="false"
                                        type="button"
                                      >
                                        Prendre une décision
                                      </button>
                                      <ModaleAccuserReceptionPropositionValeurAvancement
                                        detailIndicateur={
                                          informationIndicateur.données
                                        }
                                        generatedHTMLID={
                                          ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT +
                                          indicateur.id
                                        }
                                        indicateur={indicateur}
                                        territoireCode={territoireCode}
                                        territoireCodeInsee={
                                          détailTerritoireSélectionné.codeInsee
                                        }
                                        territoireNom={
                                          détailTerritoireSélectionné.nom
                                        }
                                      />
                                      <ModaleAccepterPropositionValeurAvancement
                                        detailIndicateur={
                                          informationIndicateur.données
                                        }
                                        generatedHTMLID={
                                          ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT +
                                          indicateur.id
                                        }
                                        indicateur={indicateur}
                                        territoireCode={territoireCode}
                                        territoireCodeInsee={
                                          détailTerritoireSélectionné.codeInsee
                                        }
                                        territoireNom={
                                          détailTerritoireSélectionné.nom
                                        }
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ) : propositionEstVisible &&
                                !estAccuseReception &&
                                estAutoriseAProposerUneValeurAvancement ? (
                                <tr className="ligne-modification-proposition-valeur-davancement">
                                  <td colSpan={8}>
                                    <div className="flex w-full justify-end">
                                      <button
                                        aria-controls={
                                          ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                                          indicateur.id
                                        }
                                        className="fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-davancement fr-mr-1w"
                                        data-fr-opened="false"
                                        type="button"
                                      >
                                        Modifier la proposition
                                      </button>
                                      <button
                                        aria-controls={
                                          ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT +
                                          indicateur.id
                                        }
                                        className="fr-btn fr-btn--icon-left fr-icon-delete-line fr-btn--secondary bouton-proposition-valeur-davancement"
                                        data-fr-opened="false"
                                        type="button"
                                      >
                                        Supprimer la proposition
                                      </button>
                                    </div>
                                    <ModalePropositionValeurAvancementV2
                                      detailIndicateur={
                                        informationIndicateur.données
                                      }
                                      generatedHTMLID={
                                        ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                                        indicateur.id
                                      }
                                      indicateur={indicateur}
                                      territoireCode={territoireCode}
                                      territoireCodeInsee={
                                        détailTerritoireSélectionné.codeInsee
                                      }
                                      territoireNom={
                                        détailTerritoireSélectionné.nom
                                      }
                                    />
                                    <ModaleSuppressionValeurAvancementV2
                                      dateValeurAvancement={
                                        informationIndicateur.données
                                          .dateValeurAvancement!
                                      }
                                      generatedHTMLID={
                                        ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT +
                                        indicateur.id
                                      }
                                      indicateur={indicateur}
                                      territoireCode={territoireCode}
                                    />
                                  </td>
                                </tr>
                              ) : null}
                            </>
                          ) : null
                        ) : null
                      ) : null}
                    </Fragment>
                  ) : null;
                })}
                {informationsIndicateursComparés.map(
                  (informationIndicateurComparé) => {
                    return informationIndicateurComparé.données ? ( // TODO supprimer une fois le refacto fait ! A cause de la react query y'a quelques frames où informationIndicateurComparé.données est undefined
                      <Fragment
                        key={informationIndicateurComparé.territoireNom}
                      >
                        <tr
                          className={`${informationIndicateurComparé.code === territoireCode ? "ligne-territoire-proposition-valeur-davancement" : "table-comparaison-border"}`}
                          key={informationIndicateurComparé.territoireNom}
                        >
                          <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm fr-text-title--light-blue-france">
                            {informationIndicateurComparé.territoireNom}
                          </td>
                          <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                            <ValeurEtDate
                              date={
                                informationIndicateurComparé.données
                                  .dateValeurInitiale
                              }
                              unité={informationIndicateurComparé.données.unité}
                              valeur={
                                informationIndicateurComparé.données
                                  .valeurInitiale
                              }
                            />
                          </td>
                          <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                            <ValeurEtDate
                              date={
                                informationIndicateurComparé.données
                                  .dateValeurAvancement
                              }
                              unité={informationIndicateurComparé.données.unité}
                              valeur={
                                informationIndicateurComparé.données
                                  .valeurAvancement
                              }
                            />
                          </td>
                          <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                            <ValeurEtDate
                              date={
                                informationIndicateurComparé.données
                                  .dateValeurCibleAnnuelle
                              }
                              unité={informationIndicateurComparé.données.unité}
                              valeur={
                                informationIndicateurComparé.données
                                  .valeurCibleAnnuelle
                              }
                            />
                          </td>
                          <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm">
                            <BarreDeProgression
                              afficherTexte
                              fond="gris-clair"
                              positionTexte="dessus"
                              taille="md"
                              valeur={
                                informationIndicateurComparé.données.avancement
                                  .annuel
                              }
                              variante="secondaire-light"
                            />
                          </td>
                          {/* Valeur et date valeur d'avancement mandat de indicateurTerritoire */}
                          <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                            <ValeurEtDate
                              date={
                                informationIndicateurComparé.données
                                  .dateValeurAvancementMandat
                              }
                              unité={informationIndicateurComparé.données.unité}
                              valeur={
                                informationIndicateurComparé.données
                                  .valeurAvancementMandat
                              }
                            />
                          </td>
                          <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
                            <ValeurEtDate
                              date={
                                informationIndicateurComparé.données
                                  .dateValeurCible
                              }
                              unité={informationIndicateurComparé.données.unité}
                              valeur={
                                informationIndicateurComparé.données.valeurCible
                              }
                            />
                          </td>
                          <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm">
                            <BarreDeProgression
                              afficherTexte
                              fond="gris-clair"
                              positionTexte="dessus"
                              taille="md"
                              valeur={
                                informationIndicateurComparé.données.avancement
                                  .global
                              }
                              variante="bleu-clair"
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
          {estInteractif ? (
            <IndicateurDétails
              cartographieDroiteIndicateur={cartographieDroiteIndicateur}
              cartographieGaucheIndicateur={cartographieGaucheIndicateur}
              chantierEstTerritorialisé={chantierEstTerritorialisé}
              dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
              dateProchaineDateMaj={dateProchaineDateMaj}
              dateProchaineDateValeurAvancement={
                dateProchaineDateValeurAvancement
              }
              dateValeurAvancement={dateValeurAvancement}
              detailsIndicateursTerritoire={detailsIndicateursTerritoire}
              détailsIndicateurs={détailsIndicateurs}
              indicateur={indicateur}
              indicateurDétailsParTerritoires={informationsIndicateurs}
              indicateurDétailsParTerritoiresComparés={
                informationsIndicateursComparés
              }
              indicateurEstAjour={!indicateurNonAJour}
              jalon={jalon}
              listeSousIndicateurs={listeSousIndicateurs}
              mailleQuery={mailleQuery}
              mailleSelectionnee={mailleSelectionnee}
              mailsDirecteursProjets={mailsDirecteursProjets}
              nouveauxGraphiquesSontActifs={nouveauxGraphiquesSontActifs}
              territoireCode={territoireCode}
              territoiresCompares={territoiresCompares}
            />
          ) : null}
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
