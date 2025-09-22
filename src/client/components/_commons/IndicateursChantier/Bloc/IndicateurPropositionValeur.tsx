import clsx from "clsx";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { formaterDate } from "@/client/utils/date/date";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import {
  estPropositionAcceptee,
  estPropositionAccepteeAvecModification,
  estPropositionAccuseeReception,
  estPropositionModifiee,
  estPropositionRefusee,
  estPropositionSupprimee,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { LigneInformationPropositionValeur } from "@/components/_commons/IndicateursChantier/Bloc/LigneInformationPropositionValeur";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";
import { BoutonProposerValeur } from "@/components/_commons/IndicateursChantier/Bloc/BoutonProposerValeur";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

const estDatajobExecutionAvantProposition = (
  datajobsExecution: DatajobsExecution,
  detailIndicateur: DétailsIndicateur,
) => {
  if (detailIndicateur.propositionStatutDirectionProjet == null) return false;
  return (
    datajobsExecution.derniereDateExecution <
    detailIndicateur.propositionStatutDirectionProjet.dateTime
  );
};

export const IndicateurPropositionValeur = ({
  estAutoriseAProposerUneValeurAvancement,
  propositionEstVisible,
  setPropositionEstVisible,
}: {
  estAutoriseAProposerUneValeurAvancement: boolean;
  propositionEstVisible: boolean;
  setPropositionEstVisible(visible: boolean): void;
}) => {
  const {
    indicateur,
    datajobsExecution,
    detailIndicateurDuTerritoire,
    territoireCode,
    configurationFeatureFlipping,
  } = useBlocIndicateurContext();

  const { maille: mailleDuTerritoireSelectionnee } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  if (!configurationFeatureFlipping.propositionValeurAvancementV2) return null;
  if (detailIndicateurDuTerritoire.valeurAvancementMandat == null) return null;

  const estAffichageSansProposition =
    detailIndicateurDuTerritoire.proposition === null;

  if (indicateur.mailleRegAgregee && mailleDuTerritoireSelectionnee === "REG") {
    return (
      <p className="fr-text--xs texte-gris fr-mb-0 flex items-center">
        Impossible de proposer une autre valeur d'avancement
        <div className="-my-2">
          <Infobulle classNameInfoBulle="tooltip-accordeon">
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

  if (estPropositionSupprimee(detailIndicateurDuTerritoire)) {
    return (
      <LigneInformationPropositionValeur
        action={
          estAutoriseAProposerUneValeurAvancement ? (
            <BoutonProposerValeur />
          ) : null
        }
        className="texte-gris"
      >
        Aucune proposition pour la valeur d'avancement de cet indicateur -{" "}
        <strong>dernière proposition en date supprimée</strong> par le
        territoire le{" "}
        {formaterDate(
          detailIndicateurDuTerritoire.propositionStatutTerritoire?.date,
          "DD/MM/YYYY",
        )}
      </LigneInformationPropositionValeur>
    );
  }

  if (estPropositionRefusee(detailIndicateurDuTerritoire)) {
    return (
      <LigneInformationPropositionValeur
        action={
          estAutoriseAProposerUneValeurAvancement ? (
            <BoutonProposerValeur />
          ) : null
        }
        className="texte-gris"
      >
        Aucune proposition pour la valeur d'avancement de cet indicateur -{" "}
        <strong>dernière proposition en date refusée</strong> par la direction
        de projet le{" "}
        {formaterDate(
          detailIndicateurDuTerritoire.propositionStatutDirectionProjet?.date,
          "DD/MM/YYYY",
        )}
      </LigneInformationPropositionValeur>
    );
  }

  if (estPropositionAccuseeReception(detailIndicateurDuTerritoire)) {
    return (
      <LigneInformationPropositionValeur
        action={
          <BoutonSousLigné
            className={clsx("!text-current fr-link--xs fr-link--icon-left", {
              "fr-icon-eye-off-line": propositionEstVisible,
              "fr-icon-eye-line": !propositionEstVisible,
            })}
            dataFrOpened={false}
            onClick={() => setPropositionEstVisible(!propositionEstVisible)}
            type="button"
          >
            {propositionEstVisible
              ? "Masquer la proposition"
              : "Afficher la proposition"}
          </BoutonSousLigné>
        }
        className="text-dsfr-info-main-525"
      >
        <strong>Proposition de nouvelle valeur d'avancement en cours</strong> –{" "}
        {estPropositionModifiee(detailIndicateurDuTerritoire)
          ? "modifiée"
          : "présentée"}{" "}
        par le territoire le{" "}
        <strong>
          {formaterDate(
            detailIndicateurDuTerritoire.proposition?.dateProposition,
            "DD/MM/YYYY",
          )}
        </strong>{" "}
        et lue par la direction de projet
      </LigneInformationPropositionValeur>
    );
  }

  if (
    (estPropositionAcceptee(detailIndicateurDuTerritoire) ||
      estPropositionAccepteeAvecModification(detailIndicateurDuTerritoire)) &&
    estDatajobExecutionAvantProposition(
      datajobsExecution,
      detailIndicateurDuTerritoire,
    )
  ) {
    return (
      <LigneInformationPropositionValeur
        action={
          <BoutonSousLigné
            className={clsx("!text-current fr-link--xs fr-link--icon-left", {
              "fr-icon-eye-off-line": propositionEstVisible,
              "fr-icon-eye-line": !propositionEstVisible,
            })}
            dataFrOpened={false}
            onClick={() => setPropositionEstVisible(!propositionEstVisible)}
            type="button"
          >
            {propositionEstVisible
              ? "Masquer la proposition"
              : "Afficher la proposition"}
          </BoutonSousLigné>
        }
        className="text-dsfr-info-main-525"
      >
        <strong>Proposition de nouvelle valeur d'avancement</strong> – présentée
        par le territoire le{" "}
        <strong>
          {formaterDate(
            detailIndicateurDuTerritoire.proposition?.dateProposition,
            "DD/MM/YYYY",
          )}
        </strong>{" "}
        et{" "}
        <strong>
          acceptée
          {estPropositionAccepteeAvecModification(detailIndicateurDuTerritoire)
            ? " avec modification"
            : ""}
        </strong>{" "}
        par la direction de projet le{" "}
        {formaterDate(
          detailIndicateurDuTerritoire.propositionStatutDirectionProjet?.date,
          "DD/MM/YYYY",
        )}
      </LigneInformationPropositionValeur>
    );
  }

  if (estAffichageSansProposition) {
    return (
      <LigneInformationPropositionValeur
        action={
          estAutoriseAProposerUneValeurAvancement ? (
            <BoutonProposerValeur />
          ) : null
        }
        className="texte-gris"
      >
        Aucune proposition pour la valeur d'avancement de cet indicateur
      </LigneInformationPropositionValeur>
    );
  }

  if (estPropositionModifiee(detailIndicateurDuTerritoire)) {
    return (
      <LigneInformationPropositionValeur
        action={
          <BoutonSousLigné
            className={clsx("!text-current fr-link--xs fr-link--icon-left", {
              "fr-icon-eye-off-line": propositionEstVisible,
              "fr-icon-eye-line": !propositionEstVisible,
            })}
            dataFrOpened={false}
            onClick={() => setPropositionEstVisible(!propositionEstVisible)}
            type="button"
          >
            {propositionEstVisible
              ? "Masquer la proposition"
              : "Afficher la proposition"}
          </BoutonSousLigné>
        }
        className="texte-jaune"
      >
        <strong>Proposition de nouvelle valeur d'avancement en cours</strong> –{" "}
        modifiée par le territoire le{" "}
        <strong>
          {formaterDate(
            detailIndicateurDuTerritoire.proposition?.dateProposition,
            "DD/MM/YYYY",
          )}
        </strong>{" "}
        et en attente de lecture par la direction de projet
      </LigneInformationPropositionValeur>
    );
  }

  return (
    <LigneInformationPropositionValeur
      action={
        <BoutonSousLigné
          className={clsx("!text-current fr-link--xs fr-link--icon-left", {
            "fr-icon-eye-off-line": propositionEstVisible,
            "fr-icon-eye-line": !propositionEstVisible,
          })}
          dataFrOpened={false}
          onClick={() => setPropositionEstVisible(!propositionEstVisible)}
          type="button"
        >
          {propositionEstVisible
            ? "Masquer la proposition"
            : "Afficher la proposition"}
        </BoutonSousLigné>
      }
      className="texte-jaune"
    >
      <strong>Proposition de nouvelle valeur d'avancement en cours</strong> –{" "}
      présentée par le territoire le{" "}
      <strong>
        {formaterDate(
          detailIndicateurDuTerritoire.proposition?.dateProposition,
          "DD/MM/YYYY",
        )}
      </strong>{" "}
      et en attente de lecture par la direction de projet
    </LigneInformationPropositionValeur>
  );
};
