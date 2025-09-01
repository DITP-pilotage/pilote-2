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
import api from "@/server/infrastructure/api/trpc/api";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";
import { LigneInformationPropositionValeur } from "@/components/_commons/IndicateursChantier/Bloc/LigneInformationPropositionValeur";

export const ID_HTML_MODALE_HISTORIQUE_INDICATEUR_TERRITOIRE_VALEUR_EVENEMENT =
  "modale-historique-indicateur-territoire-valeur-evenement";

export const IndicateurPropositionValeur = ({
  estAutoriseAProposerUneValeurAvancement,
  propositionEstVisible,
  setPropositionEstVisible,
  informationsIndicateurs,
  detailIndicateur,
  indicateur,
  chantier,
  territoireCode,
  maille,
}: {
  estAutoriseAProposerUneValeurAvancement: boolean;
  propositionEstVisible: boolean;
  setPropositionEstVisible(visible: boolean): void;
  detailIndicateur: DétailsIndicateur;
  indicateur: Indicateur;
  informationsIndicateurs: InformationsIndicateurs;
  chantier: Chantier;
  territoireCode: string;
  maille: MailleTerritoireSelectionne;
}) => {
  // TODO : attention ce truc est un hook
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);

  const { data: variableContenuFFPropositionValeurAvancementV2 } =
    api.gestionContenu.récupérerVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE_V2",
    });

  if (!variableContenuFFPropositionValeurAvancementV2) return null;
  if (detailIndicateur.valeurAvancementMandat == null) return null;

  const estAffichageSansProposition =
    informationsIndicateurs[0].données.proposition === null ||
    estPropositionSupprimee(detailIndicateur) ||
    estPropositionRefusee(detailIndicateur);

  if (indicateur.mailleRegAgregee && maille === "REG") {
    return (
      <p className="fr-text--xs texte-gris fr-mb-0 flex items-center">
        Impossible de proposer une autre valeur d'avancement
        <div className="-my-2">
          <Infobulle
            classNameInfoBulle="tooltip-accordeon"
            idHtml={`infobulle-proposition-desactivee-${indicateur.id}`}
          >
            <p className="fr-text--sm">
              Les résultats de cet indicateur sont agrégés depuis le niveau
              départemental. Il n'est donc pas possible de proposer une valeur à
              une autre maille. Vous pouvez, soit proposer une valeur
              directement au niveau d'un département ou contacter directement le
              directeur de projet via l'onglet Responsables.
            </p>
          </Infobulle>
        </div>
      </p>
    );
  }

  if (estAffichageSansProposition) {
    return (
      <LigneInformationPropositionValeur
        action={
          estAutoriseAProposerUneValeurAvancement ? (
            <BoutonSousLigné
              aria-controls={
                ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + indicateur.id
              }
              className="fr-link--xs fr-link--icon-left fr-icon-edit-line texte-gris"
              dataFrOpened={false}
              type="button"
            >
              Proposer une autre valeur d'avancement
            </BoutonSousLigné>
          ) : null
        }
        chantier={chantier}
        className="texte-gris"
        indicateur={indicateur}
        territoireCode={territoireCode}
        territoireSélectionné={territoireSélectionné}
      >
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
      </LigneInformationPropositionValeur>
    );
  }

  if (estPropositionAccuseeReception(detailIndicateur)) {
    return (
      <LigneInformationPropositionValeur
        action={
          <BoutonSousLigné
            className={`fr-link--xs fr-link--icon-left ${propositionEstVisible ? "fr-icon-eye-off-line" : "fr-icon-eye-line"} texte-jaune `}
            dataFrOpened={false}
            onClick={() => setPropositionEstVisible(!propositionEstVisible)}
            type="button"
          >
            {propositionEstVisible
              ? "Masquer la proposition"
              : "Afficher la proposition"}
          </BoutonSousLigné>
        }
        chantier={chantier}
        className="texte-bleu"
        indicateur={indicateur}
        territoireCode={territoireCode}
        territoireSélectionné={territoireSélectionné}
      >
        <strong>Proposition de nouvelle valeur d'avancement en cours</strong> –{" "}
        {estPropositionModifiee(detailIndicateur) ? "modifiée" : "présentée"}{" "}
        par le territoire le{" "}
        <strong>
          {formaterDate(
            informationsIndicateurs[0].données.proposition?.dateProposition,
            "DD/MM/YYYY",
          )}
        </strong>{" "}
        et lue
      </LigneInformationPropositionValeur>
    );
  }

  return (
    <LigneInformationPropositionValeur
      action={
        <BoutonSousLigné
          className={`fr-link--xs fr-link--icon-left ${propositionEstVisible ? "fr-icon-eye-off-line" : "fr-icon-eye-line"} texte-jaune `}
          dataFrOpened={false}
          onClick={() => setPropositionEstVisible(!propositionEstVisible)}
          type="button"
        >
          {propositionEstVisible
            ? "Masquer la proposition"
            : "Afficher la proposition"}
        </BoutonSousLigné>
      }
      chantier={chantier}
      className="texte-jaune"
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireSélectionné={territoireSélectionné}
    >
      <strong>Proposition de nouvelle valeur d'avancement en cours</strong> –{" "}
      {estPropositionModifiee(detailIndicateur) ? "modifiée" : "présentée"} par
      le territoire le{" "}
      <strong>
        {formaterDate(
          informationsIndicateurs[0].données.proposition?.dateProposition,
          "DD/MM/YYYY",
        )}
      </strong>{" "}
      et en attente de lecture par la direction de projet
    </LigneInformationPropositionValeur>
  );
};
