import { PropsWithChildren, useState } from "react";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Accordion } from "@/components/shared/Accordion";
import clsx from "clsx";
import { PageLoader } from "@/components/shared/PageLoader";
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
          <p className="font-bold mb-0 text-dsfr-blue-france-sun-113">
            → nouvelle valeur importée dans PILOTE : {valeur}
          </p>
        );
      case "VALEUR_MODIFIEE":
        return (
          <div>
            <p className="mb-0">
              <span className="font-bold">import de données</span> par la
              direction de projet
            </p>
            {valeur === null ? (
              <p className="font-bold mb-0 text-dsfr-blue-france-sun-113">
                → la valeur a été supprimée de PILOTE
              </p>
            ) : (
              <p className="font-bold mb-0 text-dsfr-blue-france-sun-113">
                → nouvelle valeur importée dans PILOTE : {valeur}
              </p>
            )}
          </div>
        );
      case "VALEUR_HISTORISEE":
        return (
          <span>
            <span className="font-bold">
              import d'une valeur d'avancement plus récente
            </span>{" "}
            par la direction de projet
          </span>
        );
      case "PROPOSITION_VALEUR_CREEE":
        return (
          <span>
            <span className="font-bold">nouvelle proposition</span> du
            territoire : {valeur ?? "N/A"}
          </span>
        );
      case "PROPOSITION_VALEUR_MODIFIEE":
        return (
          <span>
            <span className="font-bold">modification de la proposition</span> du
            territoire : {valeur ?? "N/A"}
          </span>
        );
      case "PROPOSITION_VALEUR_SUPPRIMEE":
        return (
          <span>
            <span className="font-bold">suppression de la proposition</span> par
            le territoire
          </span>
        );
      case "PROPOSITION_VALEUR_ACCUSEE_RECEPTION":
        return (
          <span>
            <span className="font-bold">
              accusé de réception de la proposition
            </span>{" "}
            par la direction de projet
          </span>
        );
      case "PROPOSITION_VALEUR_REFUSEE":
        return (
          <div>
            <p className="mb-0">
              proposition
              <span className="font-bold"> refusée</span> par la direction de
              projet
            </p>
          </div>
        );
      case "PROPOSITION_VALEUR_ACCEPTEE":
        return (
          <div>
            <p className="mb-0">
              proposition
              <span className="font-bold"> acceptée</span> par la direction de
              projet
            </p>
            <p className="font-bold mb-0 text-dsfr-blue-france-sun-113">
              → nouvelle valeur importée dans PILOTE : {valeur}
            </p>
          </div>
        );
      case "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION":
        return (
          <div>
            <p className="mb-0">
              proposition
              <span className="font-bold"> acceptée avec modification</span> par
              la direction de projet
            </p>
            <p className="font-bold mb-0 text-dsfr-blue-france-sun-113">
              → nouvelle valeur importée dans PILOTE : {valeur}
            </p>
          </div>
        );
      case "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE":
        return (
          <div>
            <p className="mb-0">
              <span className="font-bold"> import de données</span> par la
              direction de projet (la proposition en cours a été ignorée)
            </p>
            {valeur === null ? (
              <p className="font-bold mb-0 text-dsfr-blue-france-sun-113">
                → la valeur a été supprimée de PILOTE
              </p>
            ) : (
              <p className="font-bold mb-0 text-dsfr-blue-france-sun-113">
                → nouvelle valeur importée dans PILOTE : {valeur}
              </p>
            )}
          </div>
        );
      case "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE":
        return (
          <span>
            <span className="font-bold">
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
        return "bg-dsfr-jaune-moutarde";
      case "PROPOSITION_VALEUR_ACCUSEE_RECEPTION":
      case "PROPOSITION_VALEUR_REFUSEE":
      case "PROPOSITION_VALEUR_ACCEPTEE":
      case "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION":
        return "bg-dsfr-blue-cumulus-975-hover";
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
      <div className="flex flex-wrap mt-2">
        <span className="w-1/6 shrink-0 m-[var(--text-spacing)] text-lg font-bold mb-0 text-dsfr-blue-france-sun-113">
          {indicateur.id}
        </span>
        <span className="w-5/6 shrink-0 m-[var(--text-spacing)] text-lg font-bold mb-0 text-dsfr-blue-france-sun-113">
          {indicateur.nom}
        </span>
      </div>
      <div className="flex flex-wrap text-dsfr-grey-50">
        <span className="w-1/6 shrink-0 m-[var(--text-spacing)] text-lg font-bold mb-0">
          {chantier.id}
        </span>
        <span className="w-5/6 shrink-0 m-[var(--text-spacing)] text-lg font-bold mb-0">
          {chantier.nom}
        </span>
      </div>
      <div className="flex flex-wrap text-dsfr-grey-50">
        <span className="w-1/6 shrink-0 m-[var(--text-spacing)] text-lg mb-0">
          Territoire
        </span>
        <span className="w-5/6 shrink-0 m-[var(--text-spacing)] text-lg mb-0">
          {territoireSélectionné.codeInsee} - {territoireSélectionné.nom}
        </span>
      </div>
      {isLoading ? (
        <PageLoader />
      ) : datesTriees.length === 0 ? (
        <Alerte type="info">
          <p>Aucun événement trouvé pour cet indicateur sur ce territoire.</p>
        </Alerte>
      ) : (
        <Accordion.Root
          className="mt-4"
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
                <Accordion.Header asChild className="border-t-0 bg-transparent">
                  <div>
                    <Accordion.Trigger className="bg-dsfr-blue-france-850 text-primary py-0 px-3 mb-1">
                      Valeur d'avancement à la date du {dateFormatee}
                    </Accordion.Trigger>
                  </div>
                </Accordion.Header>
                <Accordion.Content
                  className="bg-transparent"
                  innerClassName="p-0"
                >
                  <div className="my-4">
                    <div className="flex flex-wrap p-3 bg-dsfr-contrast-grey">
                      <div className="w-1/6 shrink-0 flex items-center">
                        date
                      </div>
                      <div className="w-5/6 shrink-0">action</div>
                    </div>
                    {evenements.map((evenement) => {
                      return (
                        <div
                          className={clsx(
                            "flex flex-wrap p-3 border-t border-t-black",
                            backgroundEvenementValeur(evenement),
                          )}
                          key={evenement.id}
                        >
                          <div className="w-1/6 shrink-0 flex items-center">
                            {formaterDate(
                              toISODateTime(evenement.dateCreation),
                              "DD/MM/YYYY HH[:]mm",
                            )}
                          </div>
                          <div className="w-5/6 shrink-0 flex items-center">
                            {evenement.donneesComplementaires ? (
                              <Infobulle
                                classNameBouton="p-0 mr-2 text-primary"
                                classNameInfoBulle="tooltip-accordeon"
                                styleIconInfoBulle="documentation"
                              >
                                <p className="text-sm print:text-base mb-0">
                                  <span className="font-bold">
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
                                  <p className="text-sm print:text-base mb-0">
                                    <span className="font-bold">
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
