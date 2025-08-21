import { FunctionComponent } from "react";
import clsx from "clsx";
import Modale from "@/components/_commons/Modale/Modale";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import Loader from "@/components/_commons/Loader/Loader";
import { formaterDate } from "@/client/utils/date/date";
import { useModaleHistoriqueIndicateurTerritoireValeurEvenement } from "./useModaleHistoriqueIndicateurTerritoireValeurEvenement";

export const ModaleHistoriqueIndicateurTerritoireValeurEvenement: FunctionComponent<{
  indicateur: Indicateur;
  chantier: Chantier;
  generatedHTMLID: string;
  territoireCode: string;
  territoireNom: string;
  territoireCodeInsee: string;
}> = ({
  indicateur,
  chantier,
  generatedHTMLID,
  territoireCode,
  territoireNom,
  territoireCodeInsee,
}) => {
  const { historique, isLoading } =
    useModaleHistoriqueIndicateurTerritoireValeurEvenement({
      indicateurId: indicateur.id,
      territoireCode,
    });

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
        return "proposition refusée par la direction de projet";
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
      case "PROPOSITION_VALEUR_REFUSEE":
      case "PROPOSITION_VALEUR_ACCUSEE_RECEPTION":
        return "!background-jaune-moutarde";
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
      tailleModale="lg"
      titre={`Historique de l'indicateur "${indicateur.nom}"`}
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
          {territoireCodeInsee} - {territoireNom}
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
              <>
                <button
                  aria-controls={`accordion-rubrique-${indicateur.id}-${dateIso}`}
                  aria-expanded={index === 0}
                  className="fr-accordion__btn !background-black !texte-white fr-py-0 fr-px-3v"
                  type="button"
                >
                  Valeur d'avancement {dateFormatee}
                </button>
                <div
                  className="fr-collapse"
                  id={`accordion-rubrique-${indicateur.id}-${dateIso}`}
                >
                  <div className="fr-my-2w">
                    <div className="fr-grid-row fr-p-3v border-t border-b fr-background-blue-france-850">
                      <div className="fr-col-2 flex align-center">date</div>
                      <div className="fr-col-10">action</div>
                    </div>
                    {evenements.map((evenement) => {
                      return (
                        <div
                          className={clsx(
                            "fr-grid-row fr-p-3v border-t border-b",
                            backgroundEvenementValeur(evenement),
                          )}
                          key={evenement.id}
                        >
                          <div className="fr-col-2 flex align-center">
                            {formaterDate(
                              evenement.dateCreation.toISOString(),
                              "DD/MM/YYYY HH[:]mm",
                            )}
                          </div>
                          <div className="fr-col-10">
                            {mapperEvenementEnLibelle(evenement)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })}
        </div>
      )}
    </Modale>
  );
};
