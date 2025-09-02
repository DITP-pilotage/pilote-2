import { ReactNode } from "react";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { InformationsIndicateurs } from "@/components/_commons/IndicateursChantier/Bloc/InformationsIndicateurs";
import { DetailIndicateurPropositionValeurAvancement } from "@/server/chantiers/domain/DetailsIndicateurs";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { formaterDate } from "@/client/utils/date/date";
import {
  estPropositionAcceptee,
  estPropositionAccepteeAvecModification,
  estPropositionAccepteeOuAccepteeAvecModification,
  estPropositionAccuseeReception,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";

export const CelluleStatutProposition = ({
  detailIndicateur,
  informationIndicateur,
  proposition,
  estAutoriseAProposerUneValeurAvancement,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
}: {
  detailIndicateur: DétailsIndicateur;
  informationIndicateur: InformationsIndicateurs[number];
  proposition: DetailIndicateurPropositionValeurAvancement;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  estAutoriseAProposerUneValeurAvancement: boolean;
}) => {
  let labelStatutProposition = "Proposition en cours";
  let infoBulle: ReactNode;

  if (estPropositionAcceptee(detailIndicateur)) {
    labelStatutProposition = "Proposition acceptée";
  } else if (estPropositionAccepteeAvecModification(detailIndicateur)) {
    labelStatutProposition = "Proposition acceptée avec modification";
  }

  if (
    estPropositionAccepteeOuAccepteeAvecModification(detailIndicateur) &&
    estAutoriseAProposerUneValeurAvancement
  ) {
    infoBulle = (
      <Infobulle
        classNameBouton="texte-proposition"
        classNameInfoBulle="tooltip-accordeon"
        idHtml={`infobulle-proposition-valeur-davancement-${informationIndicateur.code}`}
        styleIconInfoBulle="informationProposition"
      >
        <p className="fr-text--sm texte-proposition">
          La proposition de valeur d'avancement a bien été acceptée
          {estPropositionAccepteeAvecModification(detailIndicateur)
            ? " avec modification"
            : ""}{" "}
          par la direction de projet et est visible par tous les utilisateurs.
          Le taux d'avancement est en cours d'intégration dans la base de
          données de PILOTE. L'ensemble des informations seront consolidées dans
          ce tableau dans un délai maximal de deux heures et vous aurez à
          nouveau la possibilité de faire une proposition de valeur
          d'avancement.
        </p>
      </Infobulle>
    );
  } else if (
    estPropositionAccepteeOuAccepteeAvecModification(detailIndicateur) &&
    estAutoriseAAccepterLesPropositionsDeValeurAvancement
  ) {
    infoBulle = (
      <Infobulle
        classNameBouton="texte-proposition"
        classNameInfoBulle="tooltip-accordeon"
        idHtml={`infobulle-proposition-valeur-davancement-${informationIndicateur.code}`}
        styleIconInfoBulle="informationProposition"
      >
        <p className="fr-text--sm texte-proposition">
          La proposition de valeur d'avancement a bien été acceptée
          {estPropositionAccepteeAvecModification(detailIndicateur)
            ? " avec modification"
            : ""}{" "}
          par la direction de projet et est visible par tous les utilisateurs.
          Le taux d'avancement est en cours d'intégration dans la base de
          données de PILOTE et sera visible dans un délai maximal de deux
          heures.
        </p>
      </Infobulle>
    );
  } else {
    infoBulle = (
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
    );
  }

  return (
    <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm">
      <div className="flex align-center selecteur-infobulle-conteneur">
        <span className="texte-proposition font-bold">
          {labelStatutProposition}
        </span>
        {infoBulle}
      </div>
      {!estPropositionAccepteeOuAccepteeAvecModification(detailIndicateur) && (
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
                    Vous ne pouvez plus intervenir sur cet indicateur tant que
                    la direction de projet n'aura pas pris une décision
                    (accepter, accepter avec modification ou refuser) ou procédé
                    à un nouvel import de données.
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
                  votre proposition. Il vous est toujours possible de modifier
                  ou de supprimer celle-ci si vous le souhaitez.
                </p>
              </Infobulle>
            </>
          )}
        </div>
      )}
    </td>
  );
};
