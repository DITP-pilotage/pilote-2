import clsx from "clsx";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { formaterDate } from "@/client/utils/date/date";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import {
  estPropositionAcceptee,
  estPropositionAccepteeAvecModification,
  estPropositionAccuseeReception,
  estPropositionModifiee,
  estPropositionRefusee,
  estPropositionSupprimee,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { LigneInformationPropositionValeur } from "@/components/_commons/IndicateursChantier/Bloc/LigneInformationPropositionValeur";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";
import { BoutonProposerValeur } from "@/components/_commons/IndicateursChantier/Bloc/BoutonProposerValeur";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import { EyeOff1Icon } from "@/components/_commons/Icones/EyeOff1Icon";

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
    chantier,
    datajobsExecution,
    detailIndicateurDuTerritoire,
    territoireCode,
  } = useBlocIndicateurContext();

  const { maille: mailleDuTerritoireSelectionnee } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  if (detailIndicateurDuTerritoire.valeurAvancementMandat == null) return null;

  const estAffichageSansProposition =
    detailIndicateurDuTerritoire.proposition === null;

  if (indicateur.mailleRegAgregee && mailleDuTerritoireSelectionnee === "REG") {
    return (
      <div className="fr-text--xs texte-gris fr-mb-0 flex items-center">
        Impossible de proposer une autre valeur d'avancement
        <Infobulle classNameInfoBulle="tooltip-accordeon">
          <p className="fr-text--sm">
            Les résultats de cet indicateur sont agrégés depuis le niveau
            départemental. Il n'est donc pas possible de proposer une valeur à
            une autre maille. Vous pouvez, soit proposer une valeur directement
            au niveau d'un département ou contacter directement le directeur de
            projet via l'onglet Responsables.
          </p>
        </Infobulle>
      </div>
    );
  }

  const estChantierArchive = chantier.statut === "ARCHIVE";

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
            className="!text-current fr-link--xs"
            dataFrOpened={false}
            iconLeft={
              <Icone
                className="text-current h-3 w-3"
                icone={propositionEstVisible ? EyeOff1Icon : Eye1Icon}
              />
            }
            onClick={() => setPropositionEstVisible(!propositionEstVisible)}
            type="button"
          >
            {propositionEstVisible
              ? "Masquer la proposition"
              : "Afficher la proposition"}
          </BoutonSousLigné>
        }
        className={clsx({
          "text-dsfr-info-main-525": !estChantierArchive,
          "text-dsfr-grey-200": estChantierArchive,
        })}
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
            className="!text-current fr-link--xs"
            dataFrOpened={false}
            iconLeft={
              <Icone
                className="text-current h-3 w-3"
                icone={propositionEstVisible ? EyeOff1Icon : Eye1Icon}
              />
            }
            onClick={() => setPropositionEstVisible(!propositionEstVisible)}
            type="button"
          >
            {propositionEstVisible
              ? "Masquer la proposition"
              : "Afficher la proposition"}
          </BoutonSousLigné>
        }
        className={clsx({
          "text-dsfr-info-main-525": !estChantierArchive,
          "text-dsfr-grey-200": estChantierArchive,
        })}
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
            className="!text-current fr-link--xs"
            dataFrOpened={false}
            iconLeft={
              <Icone
                className="text-current h-3 w-3"
                icone={propositionEstVisible ? EyeOff1Icon : Eye1Icon}
              />
            }
            onClick={() => setPropositionEstVisible(!propositionEstVisible)}
            type="button"
          >
            {propositionEstVisible
              ? "Masquer la proposition"
              : "Afficher la proposition"}
          </BoutonSousLigné>
        }
        className={clsx({
          "text-dsfr-moutarde-main-679": !estChantierArchive,
          "text-dsfr-grey-200": estChantierArchive,
        })}
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
          className="!text-current fr-link--xs"
          dataFrOpened={false}
          iconLeft={
            <Icone
              className="text-current h-3 w-3"
              icone={propositionEstVisible ? EyeOff1Icon : Eye1Icon}
            />
          }
          onClick={() => setPropositionEstVisible(!propositionEstVisible)}
          type="button"
        >
          {propositionEstVisible
            ? "Masquer la proposition"
            : "Afficher la proposition"}
        </BoutonSousLigné>
      }
      className={clsx({
        "text-dsfr-moutarde-main-679": !estChantierArchive,
        "text-dsfr-grey-200": estChantierArchive,
      })}
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
