import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { formaterDate } from "@/client/utils/date/date";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { InformationsIndicateurs } from "@/components/_commons/IndicateursChantier/Bloc/InformationsIndicateurs";
import {
  estPropositionAccuseeReception,
  estPropositionModifiee,
  estPropositionRefusee,
  estPropositionSupprimee,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";

export const IndicateurPropositionValeur = ({
  estAutoriseAProposerUneValeurAvancement,
  estAutoriseAVoirLesPropositionsDeValeurAvancement,
  propositionEstVisible,
  setPropositionEstVisible,
  detailIndicateur,
  indicateur,
  informationsIndicateurs,
}: {
  estAutoriseAProposerUneValeurAvancement: boolean;
  estAutoriseAVoirLesPropositionsDeValeurAvancement: boolean;
  propositionEstVisible: boolean;
  setPropositionEstVisible(visible: boolean): void;
  detailIndicateur: DétailsIndicateur;
  indicateur: Indicateur;
  informationsIndicateurs: InformationsIndicateurs;
}) => {
  if (
    !(
      estAutoriseAProposerUneValeurAvancement ||
      estAutoriseAVoirLesPropositionsDeValeurAvancement
    )
  ) {
    return null;
  }

  const estAffichageSansProposition =
    informationsIndicateurs[0].données.proposition === null ||
    estPropositionSupprimee(detailIndicateur) ||
    estPropositionRefusee(detailIndicateur);

  if (estAffichageSansProposition) {
    return (
      <div>
        <p className="fr-text--xs texte-gris fr-mb-0">
          Aucune proposition pour la valeur d'avancement de cet indicateur{" "}
          {estPropositionSupprimee(detailIndicateur) ? (
            <>
              {" "}
              - <strong>dernière proposition en date supprimée</strong> par le
              territoire le{" "}
              {formaterDate(
                detailIndicateur.propositionStatutTerritoire?.date,
                "DD/MM/YYYY",
              )}
            </>
          ) : null}
          {estPropositionRefusee(detailIndicateur) ? (
            <>
              {" "}
              - <strong>dernière proposition en date refusée</strong> par la
              direction de projet le{" "}
              {formaterDate(
                detailIndicateur.propositionStatutDirectionProjet?.date,
                "DD/MM/YYYY",
              )}
            </>
          ) : null}
        </p>
        <BoutonSousLigné
          ariaControls={
            ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + indicateur.id
          }
          classNameSupplémentaires="fr-link--xs fr-link--icon-left fr-icon-edit-line texte-gris"
          dataFrOpened={false}
          type="button"
        >
          Proposer une autre valeur d'avancement
        </BoutonSousLigné>
      </div>
    );
  }

  return (
    <div>
      <p className="fr-text--xs texte-jaune fr-mb-0">
        <strong>Proposition de nouvelle valeur d'avancement en cours</strong> –{" "}
        {estPropositionModifiee(detailIndicateur) ? "modifiée" : "présentée"}{" "}
        par le territoire le{" "}
        <strong>
          {formaterDate(
            informationsIndicateurs[0].données.proposition?.dateProposition,
            "DD/MM/YYYY",
          )}
        </strong>{" "}
        et{" "}
        {estPropositionAccuseeReception(detailIndicateur)
          ? "lue"
          : "en attente de lecture"}{" "}
        par la direction de projet
      </p>
      <BoutonSousLigné
        classNameSupplémentaires={`fr-link--xs fr-link--icon-left ${propositionEstVisible ? "fr-icon-eye-off-line" : "fr-icon-eye-line"} texte-jaune `}
        dataFrOpened={false}
        onClick={() => setPropositionEstVisible(!propositionEstVisible)}
        type="button"
      >
        {propositionEstVisible
          ? "Masquer la proposition"
          : "Afficher la proposition"}
      </BoutonSousLigné>
    </div>
  );
};
