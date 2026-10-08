import { PropsWithChildren, useState } from "react";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Accordion } from "@/components/shared/Accordion";
import clsx from "clsx";
import Loader from "@/components/_commons/Loader/Loader";
import { formaterDate } from "@/client/utils/date/date";
import { Infobulle } from "@/components/shared/Infobulle";
import { DonneesComplementaires } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { toISODateTime } from "@/server/app/domain/Dates";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { Modale } from "@/components/shared/Modale";
import { useModaleHistoriqueIndicateurTerritoireValeurEvenement } from "./useModaleHistoriqueIndicateurTerritoireValeurEvenement";

export const ModaleHistoriqueIndicateurTerritoireValeurEvenement = ({
  children,
}: PropsWithChildren) => {
  const { indicateur, chantier, territoireSélectionné } =
    useBlocIndicateurContext();

  const [open, setOpen] = useState(false);
  const { historique, isLoading } =
    useModaleHistoriqueIndicateurTerritoireValeurEvenement(open);

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
            {valeur === null ? (
              <p className="fr-mb-0 !texte-blue-france fr-text--bold">
                → la valeur a été supprimée de PILOTE
              </p>
            ) : (
              <p className="fr-mb-0 !texte-blue-france fr-text--bold">
                → nouvelle valeur affichée dans PILOTE : {valeur}
              </p>
            )}
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
            {valeur === null ? (
              <p className="fr-mb-0 !texte-blue-france fr-text--bold">
                → la valeur a été supprimée de PILOTE
              </p>
            ) : (
              <p className="fr-mb-0 !texte-blue-france fr-text--bold">
                → nouvelle valeur affichée dans PILOTE : {valeur}
              </p>
            )}
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
      onOpenChange={setOpen}
      open={open}
      title="Historique des actions sur les valeurs d'avancement"
      trigger={children}
    >
      <div className="fr-grid-row fr-mt-1w">
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-2 !texte-blue-france">
          {indicateur.id}
        </span>
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-10 !texte-blue-france">
          {indicateur.nom}
        </span>
      </div>
      <div className="fr-grid-row !texte-title-grey">
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-2">
          {chantier.id}
        </span>
        <span className="fr-text--lg fr-text--bold fr-mb-0 fr-col-10">
          {chantier.nom}
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
        <Alerte type="info">
          <p>Aucun événement trouvé pour cet indicateur sur ce territoire.</p>
        </Alerte>
      ) : (
        <Accordion.Root
          className="historique-container fr-mt-2w"
          defaultValue={
            datesTriees.length > 0
              ? [`accordion-rubrique-${indicateur.id}-${datesTriees[0]}-0`]
              : []
          }
          type="multiple"
        >
          {datesTriees.map((dateIso, index) => {
            const evenements = historique[dateIso];
            const dateFormatee = formaterDate(dateIso, "MM/YYYY");

            return (
              <Accordion.Item
                className="border-b-0"
                key={`accordion-rubrique-${indicateur.id}-${dateIso}-${index}`}
                value={`accordion-rubrique-${indicateur.id}-${dateIso}-${index}`}
              >
                <Accordion.Header
                  asChild
                  className="border-t-0 !bg-transparent"
                >
                  <div>
                    <Accordion.Trigger className="!bg-dsfr-blue-france-850 !text-primary !py-0 !px-3 mb-1">
                      Valeur d'avancement à la date du {dateFormatee}
                    </Accordion.Trigger>
                  </div>
                </Accordion.Header>
                <Accordion.Content
                  className="!bg-transparent"
                  innerClassName="p-0"
                >
                  <div className="fr-my-2w">
                    <div className="fr-grid-row fr-p-3v bg-dsfr-contrast-grey">
                      <div className="fr-col-2 flex items-center">date</div>
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
                          <div className="fr-col-2 flex items-center">
                            {formaterDate(
                              toISODateTime(evenement.dateCreation),
                              "DD/MM/YYYY HH[:]mm",
                            )}
                          </div>
                          <div className="fr-col-10 flex items-center">
                            {evenement.donneesComplementaires ? (
                              <Infobulle
                                classNameBouton="fr-p-0 fr-mr-1w !text-primary"
                                classNameInfoBulle="tooltip-accordeon"
                                styleIconInfoBulle="documentation"
                              >
                                <p className="fr-text--sm mb-0">
                                  <span className="fr-text--bold">
                                    Motif de la proposition :
                                  </span>{" "}
                                  <span className="italic">
                                    {evenement.donneesComplementaires.motif}
                                  </span>
                                </p>
                                {(
                                  evenement.donneesComplementaires as DonneesComplementaires<
                                    | "PROPOSITION_VALEUR_CREEE"
                                    | "PROPOSITION_VALEUR_MODIFIEE"
                                  >
                                )?.sourceDonneeEtMethodeCalcul ? (
                                  <p className="fr-text--sm mb-0">
                                    <span className="fr-text--bold">
                                      Source des données et méthode de calcul :
                                    </span>{" "}
                                    <span className="italic">
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
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      )}
    </Modale>
  );
};
