import { PropsWithChildren } from "react";
import clsx from "clsx";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { InformationsIndicateurs } from "@/components/_commons/IndicateursChantier/Bloc/InformationsIndicateurs";
import { DetailIndicateurPropositionValeurAvancement } from "@/server/chantiers/domain/DetailsIndicateurs";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { formaterDate } from "@/client/utils/date/date";
import { estPropositionAccuseeReception } from "@/components/_commons/IndicateursChantier/Bloc/utils";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { usePageChantierContext } from "@/components/PageChantier/usePageChantierContext";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";

export const doitAfficherPropositionAcceptee = (
  detailIndicateur: DétailsIndicateur,
  datajobsExecution: DatajobsExecution,
) => {
  const estPropositionAcceptee = [
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
  ].includes(detailIndicateur.propositionStatutDirectionProjet?.statut ?? "");

  return (
    estPropositionAcceptee &&
    detailIndicateur.propositionStatutDirectionProjet != null &&
    datajobsExecution.derniereDateExecution <
      detailIndicateur.propositionStatutDirectionProjet.dateTime
  );
};

export const BaseLignesPropositionValeurAvancement = ({
  detailIndicateur,
  informationIndicateur,
  proposition,
  jalon,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
  estAutoriseAProposerUneValeurAvancement,
  children,
}: PropsWithChildren<{
  jalon: number;
  detailIndicateur: DétailsIndicateur;
  informationIndicateur: InformationsIndicateurs[number];
  proposition: DetailIndicateurPropositionValeurAvancement;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  estAutoriseAProposerUneValeurAvancement: boolean;
}>) => {
  const { datajobsExecution } = usePageChantierContext();

  const estPropositionAcceptee = [
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
  ].includes(detailIndicateur.propositionStatutDirectionProjet?.statut ?? "");
  const afficherPropositionAcceptee = doitAfficherPropositionAcceptee(
    detailIndicateur,
    datajobsExecution,
  );

  const estPropositionSurLeBonJalon =
    detailIndicateur.dateValeurAvancementMandat !== null
      ? new Date(detailIndicateur.dateValeurAvancementMandat!).getFullYear() <=
        jalon
      : false;

  let labelStatutProposition = "Proposition en cours";

  if (
    detailIndicateur.propositionStatutDirectionProjet?.statut ===
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE
  ) {
    labelStatutProposition = "Proposition acceptée";
  } else if (
    detailIndicateur.propositionStatutDirectionProjet?.statut ===
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION
  ) {
    labelStatutProposition = "Proposition acceptée avec modification";
  }

  return (
    <>
      <tr
        className={clsx("ligne-modification-proposition-valeur-davancement", {
          "!bg-dsfr-info-950 !text-dsfr-info-main-525":
            estPropositionAccuseeReception(detailIndicateur) ||
            afficherPropositionAcceptee,
          "!bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679":
            !estPropositionAccuseeReception(detailIndicateur) &&
            !estPropositionAcceptee,
        })}
        key={informationIndicateur.territoireNom}
      >
        <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm">
          <div className="flex align-center selecteur-infobulle-conteneur">
            <span className="texte-proposition font-bold">
              {labelStatutProposition}
            </span>
            <Infobulle
              classNameBouton="texte-proposition"
              classNameInfoBulle="tooltip-accordeon"
              idHtml={`infobulle-proposition-valeur-davancement-${informationIndicateur.code}`}
              styleIconInfoBulle="informationProposition"
            >
              <p className="fr-text--sm texte-proposition">
                Valeur d'avancement proposée le{" "}
                {formaterDate(proposition.dateProposition, "DD/MM/YYYY")} par{" "}
                {proposition.auteur}
              </p>
              <p className="fr-text--sm">
                <b>Motif de la proposition</b>
              </p>
              <p className="fr-text--sm">{proposition.motif}</p>
              <p className="fr-text--sm">
                <b>Source des données et méthode de calcul</b>
              </p>
              <p className="fr-text--sm fr-mb-0">
                {proposition.sourceDonneeEtMethodeCalcul}
              </p>
            </Infobulle>
          </div>
          {!estPropositionAcceptee && (
            <div className="flex align-center selecteur-infobulle-conteneur">
              {estPropositionAccuseeReception(detailIndicateur) ? (
                <>
                  <span className="fr-text--xs texte-gris">
                    la direction de projet a accusé réception
                  </span>
                  <Infobulle
                    classNameBouton="texte-gris"
                    classNameInfoBulle="tooltip-accordeon"
                    idHtml={`infobulle-proposition-valeur-davancement-accusee-reception-${informationIndicateur.code}`}
                  >
                    {estAutoriseAProposerUneValeurAvancement ? (
                      <p className="fr-text--sm">
                        Vous ne pouvez plus intervenir sur cet indicateur tant
                        que la direction de projet n'aura pas pris une décision
                        (accepter, accepter avec modification ou refuser) ou
                        procédé à un nouvel import de données.
                      </p>
                    ) : estAutoriseAAccepterLesPropositionsDeValeurAvancement ? (
                      <p className="fr-text--sm">
                        Le territoire ne peut plus intervenir sur cet indicateur
                        tant que vous n'aurez pas pris une décision (accepter,
                        accepter avec modification ou refuser) ou procédé à un
                        nouvel import de données.
                      </p>
                    ) : null}
                  </Infobulle>
                </>
              ) : (
                <>
                  <span className="fr-text--xs texte-gris">
                    En attente de lecture par la direction de projet
                  </span>
                  <Infobulle
                    classNameBouton="texte-gris"
                    classNameInfoBulle="tooltip-accordeon"
                    idHtml={`infobulle-proposition-valeur-davancement-statut-${informationIndicateur.code}`}
                  >
                    <p className="fr-text--sm">
                      La direction de projet n'a pas encore accusé réception de
                      votre proposition. Il vous est toujours possible de
                      modifier ou de supprimer celle-ci si vous le souhaitez.
                    </p>
                  </Infobulle>
                </>
              )}
            </div>
          )}
        </td>
        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center text-dsfr-grey-200">
          <ValeurEtDate
            date={informationIndicateur.données.dateValeurInitiale}
            unité={informationIndicateur.données.unité}
            valeur={informationIndicateur.données.valeurInitiale}
          />
        </td>
        {estPropositionSurLeBonJalon ? (
          <>
            {/* Valeur d'avancement en fonction de la proposition du jalon et date valeur d'avancement en fonction du mandat */}
            <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm texte-proposition text-center">
              <ValeurEtDate
                date={informationIndicateur.données.dateValeurAvancementMandat}
                unité={informationIndicateur.données.unité}
                valeur={proposition.valeurAvancement}
              />
            </td>
            <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center text-dsfr-grey-200">
              <ValeurEtDate
                date={informationIndicateur.données.dateValeurCibleAnnuelle}
                unité={informationIndicateur.données.unité}
                valeur={informationIndicateur.données.valeurCibleAnnuelle}
              />
            </td>
            <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition">
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                infobulleId={`infobulle-taux-avancement-proposition-jalon-${informationIndicateur.code}`}
                positionTexte="dessus"
                taille="md"
                valeur={proposition.tauxAvancementIntermediaire}
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
            date={informationIndicateur.données.dateValeurAvancementMandat}
            unité={informationIndicateur.données.unité}
            valeur={proposition.valeurAvancement}
          />
        </td>
        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center text-dsfr-grey-200">
          <ValeurEtDate
            date={informationIndicateur.données.dateValeurCible}
            unité={informationIndicateur.données.unité}
            valeur={informationIndicateur.données.valeurCible}
          />
        </td>
        <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition">
          <BarreDeProgression
            afficherTexte
            fond="gris-clair"
            infobulleId={`infobulle-taux-avancement-proposition-global-${informationIndicateur.code}`}
            positionTexte="dessus"
            taille="md"
            valeur={proposition.tauxAvancement}
            variante="jaune-moutarde"
          />
        </td>
      </tr>
      {children}
    </>
  );
};
