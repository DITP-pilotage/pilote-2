import { Fragment, FunctionComponent } from "react";
import clsx from "clsx";
import Modale from "@/components/_commons/Modale/Modale";
import Loader from "@/components/_commons/Loader/Loader";
import { formaterDate } from "@/client/utils/date/date";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { DonneesComplementaires } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { toISODateTime } from "@/server/app/domain/Dates";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useModaleHistoriqueIndicateurTerritoireValeurEvenement } from "./useModaleHistoriqueIndicateurTerritoireValeurEvenement";

export const ModaleHistoriqueIndicateurTerritoireValeurEvenement: FunctionComponent<{
  generatedHTMLID: string;
}> = ({ generatedHTMLID }) => {
  const { indicateur, chantier, territoireSélectionné } =
    useBlocIndicateurContext();

  const { historique, isLoading } =
    useModaleHistoriqueIndicateurTerritoireValeurEvenement();

  const mapperEvenementEnLibelle = ({
    typeEvenement,
    valeur,
  }: {
    typeEvenement: string;
    valeur?: number | null;
  }) => {
    switch (typeEvenement) {
      case "VALEUR_CREEE":
        return (
          <p className="fr-mb-0 !texte-blue-france fr-text--bold">
            → nouvelle valeur affichée dans PILOTE : {valeur}
          </p>
        );
      case "VALEUR_MODIFIEE":
        return (
          <div>
            <p className="fr-mb-0">
              <span className="fr-text--bold">import de données</span> par la
              direction de projet
            </p>
            <p className="fr-mb-0 !texte-blue-france fr-text--bold">
              → nouvelle valeur affichée dans PILOTE : {valeur}
            </p>
          </div>
        );
      case "VALEUR_HISTORISEE":
        return (
          <span>
            <span className="fr-text--bold">
              import d'une valeur d'avancement plus récente
            </span>{" "}
            par la direction de projet
          </span>
        );
      case "PROPOSITION_VALEUR_CREEE":
        return (
          <span>
            <span className="fr-text--bold">nouvelle proposition</span> du
            territoire : {valeur ?? "N/A"}
          </span>
        );
      case "PROPOSITION_VALEUR_MODIFIEE":
        return (
          <span>
            <span className="fr-text--bold">
              modification de la proposition
            </span>{" "}
            du territoire : {valeur ?? "N/A"}
          </span>
        );
      case "PROPOSITION_VALEUR_SUPPRIMEE":
        return (
          <span>
            <span className="fr-text--bold">suppression de la proposition</span>{" "}
            par le territoire
          </span>
        );
      case "PROPOSITION_VALEUR_ACCUSEE_RECEPTION":
        return (
          <span>
            <span className="fr-text--bold">
              accusé de réception de la proposition
            </span>{" "}
            par la direction de projet
          </span>
        );
      case "PROPOSITION_VALEUR_REFUSEE":
        return (
          <div>
            <p className="fr-mb-0">
              proposition
              <span className="fr-text--bold"> refusée</span> par la direction
              de projet
            </p>
          </div>
        );
      case "PROPOSITION_VALEUR_ACCEPTEE":
        return (
          <div>
            <p className="fr-mb-0">
              proposition
              <span className="fr-text--bold"> acceptée</span> par la direction
              de projet
            </p>
            <p className="fr-mb-0 !texte-blue-france fr-text--bold">
              → nouvelle valeur affichée dans PILOTE : {valeur}
            </p>
          </div>
        );
      case "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION":
        return (
          <div>
            <p className="fr-mb-0">
              proposition
              <span className="fr-text--bold">
                {" "}
                acceptée avec modification
              </span>{" "}
              par la direction de projet
            </p>
            <p className="fr-mb-0 !texte-blue-france fr-text--bold">
              → nouvelle valeur affichée dans PILOTE : {valeur}
            </p>
          </div>
        );
      case "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE":
        return (
          <div>
            <p className="fr-mb-0">
              <span className="fr-text--bold"> import de données</span> par la
              direction de projet (la proposition en cours a été ignorée)
            </p>
            <p className="fr-mb-0 !texte-blue-france fr-text--bold">
              → nouvelle valeur affichée dans PILOTE : {valeur}
            </p>
          </div>
        );
      case "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE":
        return (
          <span>
            <span className="fr-text--bold">
              import d'une valeur d'avancement plus récente
            </span>{" "}
            par la direction de projet (la proposition en cours a été ignorée)
          </span>
        );
      default:
        return typeEvenement;
    }
  };

  const backgroundEvenementValeur = ({
    typeEvenement,
  }: {
    typeEvenement: string;
  }) => {
    switch (typeEvenement) {
      case "PROPOSITION_VALEUR_CREEE":
      case "PROPOSITION_VALEUR_MODIFIEE":
        return "!background-jaune-moutarde";
      case "PROPOSITION_VALEUR_ACCUSEE_RECEPTION":
      case "PROPOSITION_VALEUR_REFUSEE":
      case "PROPOSITION_VALEUR_ACCEPTEE":
      case "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION":
        return "!background-bleu-cumulus";
      default:
        return "";
    }
  };

  const datesTriees = Object.keys(historique).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <Modale
      idHtml={generatedHTMLID}
      scrollable
      tailleModale="lg"
      titre="Historique des actions sur les valeurs d'avancement"
    >
      <div className="fr-grid-row fr-mt-1w">
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-2 !texte-blue-france">
          {chantier.id}
        </span>
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-10 !texte-blue-france">
          {chantier.nom}
        </span>
      </div>
      <div className="fr-grid-row !texte-title-grey">
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-2">
          {indicateur.id}
        </span>
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-10">
          {indicateur.nom}
        </span>
      </div>
      <div className="fr-grid-row !texte-title-grey">
        <span className="fr-text--lg fr-mb-0 fr-col-2">Territoire</span>
        <span className="fr-text--lg fr-mb-0 fr-col-10">
          {territoireSélectionné.codeInsee} - {territoireSélectionné.nom}
        </span>
      </div>
      {isLoading ? (
        <Loader />
      ) : datesTriees.length === 0 ? (
        <div className="fr-alert fr-alert--info">
          <p>Aucun événement trouvé pour cet indicateur sur ce territoire.</p>
        </div>
      ) : (
        <div className="historique-container fr-mt-2w">
          {datesTriees.map((dateIso, index) => {
            const evenements = historique[dateIso];
            const dateFormatee = formaterDate(dateIso, "MM/YYYY");

            return (
              <Fragment
                key={`accordion-rubrique-${indicateur.id}-${dateIso}-${index}`}
              >
                <button
                  aria-controls={`accordion-rubrique-${indicateur.id}-${dateIso}-${index}`}
                  aria-expanded={index === 0}
                  className="fr-accordion__btn !background-black !texte-white fr-py-0 fr-px-3v fr-mb-1v"
                  type="button"
                >
                  Valeur d'avancement {dateFormatee}
                </button>
                <div
                  className="fr-collapse"
                  id={`accordion-rubrique-${indicateur.id}-${dateIso}-${index}`}
                >
                  <div className="fr-my-2w">
                    <div className="fr-grid-row fr-p-3v fr-background-blue-france-850">
                      <div className="fr-col-2 flex align-center">date</div>
                      <div className="fr-col-10">action</div>
                    </div>
                    {evenements.map((evenement) => {
                      return (
                        <div
                          className={clsx(
                            "fr-grid-row fr-p-3v border-t border-t-black",
                            backgroundEvenementValeur(evenement),
                          )}
                          key={evenement.id}
                        >
                          <div className="fr-col-2 flex align-center">
                            {formaterDate(
                              toISODateTime(evenement.dateCreation),
                              "DD/MM/YYYY HH[:]mm",
                            )}
                          </div>
                          <div className="fr-col-10 flex align-center">
                            {evenement.donneesComplementaires ? (
                              <Infobulle
                                classNameBouton="fr-p-0 fr-mr-1w"
                                classNameInfoBulle="tooltip-accordeon"
                                styleIconInfoBulle="documentation"
                              >
                                <p className="fr-callout__text fr-text--sm">
                                  <span className="fr-text--bold">
                                    Motif de la proposition :
                                  </span>{" "}
                                  <span className="text-italic">
                                    {evenement.donneesComplementaires.motif}
                                  </span>
                                </p>
                                {(
                                  evenement.donneesComplementaires as DonneesComplementaires<
                                    | "PROPOSITION_VALEUR_CREEE"
                                    | "PROPOSITION_VALEUR_MODIFIEE"
                                  >
                                )?.sourceDonneeEtMethodeCalcul ? (
                                  <p className="fr-callout__text fr-text--sm">
                                    <span className="fr-text--bold">
                                      Source des données et méthode de calcul :
                                    </span>{" "}
                                    <span className="text-italic">
                                      {
                                        (
                                          evenement.donneesComplementaires as DonneesComplementaires<
                                            | "PROPOSITION_VALEUR_CREEE"
                                            | "PROPOSITION_VALEUR_MODIFIEE"
                                          >
                                        ).sourceDonneeEtMethodeCalcul
                                      }
                                    </span>
                                  </p>
                                ) : null}
                              </Infobulle>
                            ) : null}
                            {mapperEvenementEnLibelle(evenement)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </Modale>
  );
};
