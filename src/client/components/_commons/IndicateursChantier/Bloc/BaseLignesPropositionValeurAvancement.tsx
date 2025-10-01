import { PropsWithChildren } from "react";
import clsx from "clsx";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import {
  estPropositionAccepteeOuAccepteeAvecModification,
  estPropositionAccuseeReception,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";
import { CelluleStatutProposition } from "@/components/_commons/IndicateursChantier/Bloc/CelluleStatutProposition";
import { BarreDeProgressionAVenir } from "@/components/_commons/IndicateursChantier/Bloc/BarreDeProgressionAVenir";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";

export const doitAfficherPropositionAcceptee = (
  detailIndicateur: DétailsIndicateur,
  datajobsExecution: DatajobsExecution,
) => {
  return (
    estPropositionAccepteeOuAccepteeAvecModification(detailIndicateur) &&
    detailIndicateur.propositionStatutDirectionProjet != null &&
    datajobsExecution.derniereDateExecution <
      detailIndicateur.propositionStatutDirectionProjet.dateTime
  );
};

export const BaseLignesPropositionValeurAvancement = ({
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
  estAutoriseAProposerUneValeurAvancement,
  children,
}: PropsWithChildren<{
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  estAutoriseAProposerUneValeurAvancement: boolean;
}>) => {
  const détailTerritoireSélectionné = useTerritoireSelectionne();

  const { datajobsExecution, detailIndicateurDuTerritoire, jalon, chantier } =
    useBlocIndicateurContext();

  if (detailIndicateurDuTerritoire.proposition === null) return null;

  const afficherPropositionAcceptee = doitAfficherPropositionAcceptee(
    detailIndicateurDuTerritoire,
    datajobsExecution,
  );

  const estPropositionSurLeBonJalon =
    detailIndicateurDuTerritoire.proposition.dateValeurAvancement !== null
      ? new Date(
          detailIndicateurDuTerritoire.proposition.dateValeurAvancement,
        ).getFullYear() <= jalon
      : false;

  const estChantierArchive = chantier.statut === "ARCHIVE";

  const varianteBarreProgression = estChantierArchive
    ? "secondaire"
    : estPropositionAccepteeOuAccepteeAvecModification(
          detailIndicateurDuTerritoire,
        ) || estPropositionAccuseeReception(detailIndicateurDuTerritoire)
      ? "bleu-dsfr-info"
      : "jaune-moutarde";

  return (
    <>
      <tr
        className={clsx("ligne-modification-proposition-valeur-davancement", {
          "!bg-dsfr-grey-925 !text-dsfr-grey-200": estChantierArchive,
          "!bg-dsfr-info-950 !text-dsfr-info-main-525":
            !estChantierArchive &&
            (estPropositionAccuseeReception(detailIndicateurDuTerritoire) ||
              afficherPropositionAcceptee),
          "!bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679":
            !estChantierArchive &&
            !estPropositionAccuseeReception(detailIndicateurDuTerritoire) &&
            !estPropositionAccepteeOuAccepteeAvecModification(
              detailIndicateurDuTerritoire,
            ),
        })}
        key={détailTerritoireSélectionné.nom}
      >
        <CelluleStatutProposition
          estAutoriseAAccepterLesPropositionsDeValeurAvancement={
            estAutoriseAAccepterLesPropositionsDeValeurAvancement
          }
          estAutoriseAProposerUneValeurAvancement={
            estAutoriseAProposerUneValeurAvancement
          }
        />
        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center text-dsfr-grey-200">
          <ValeurEtDate
            date={detailIndicateurDuTerritoire.dateValeurInitiale}
            unité={detailIndicateurDuTerritoire.unité}
            valeur={detailIndicateurDuTerritoire.valeurInitiale}
          />
        </td>
        {estPropositionSurLeBonJalon ? (
          <>
            {/* Valeur d'avancement en fonction de la proposition du jalon et date valeur d'avancement en fonction du mandat */}
            <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm texte-proposition text-center">
              <ValeurEtDate
                date={
                  detailIndicateurDuTerritoire.proposition.dateValeurAvancement
                }
                unité={detailIndicateurDuTerritoire.unité}
                valeur={
                  detailIndicateurDuTerritoire.proposition.valeurAvancement
                }
              />
            </td>
            <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center text-dsfr-grey-200">
              <ValeurEtDate
                date={detailIndicateurDuTerritoire.dateValeurCibleAnnuelle}
                unité={detailIndicateurDuTerritoire.unité}
                valeur={detailIndicateurDuTerritoire.valeurCibleAnnuelle}
              />
            </td>
            <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition">
              {detailIndicateurDuTerritoire.proposition.statutTauxAvancement ===
              "EN_COURS" ? (
                <BarreDeProgressionAVenir variante={varianteBarreProgression} />
              ) : (
                <BarreDeProgression
                  afficherTexte
                  fond="gris-clair"
                  positionTexte="dessus"
                  taille="md"
                  valeur={
                    detailIndicateurDuTerritoire.proposition
                      .tauxAvancementIntermediaire
                  }
                  variante={varianteBarreProgression}
                />
              )}
            </td>
          </>
        ) : (
          <td colSpan={3} />
        )}
        {/* Valeur d'avancement en fonction de la proposition du jalon et date valeur d'avancement en fonction du mandat */}
        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm texte-proposition text-center">
          <ValeurEtDate
            date={detailIndicateurDuTerritoire.proposition.dateValeurAvancement}
            unité={detailIndicateurDuTerritoire.unité}
            valeur={detailIndicateurDuTerritoire.proposition.valeurAvancement}
          />
        </td>
        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center text-dsfr-grey-200">
          <ValeurEtDate
            date={detailIndicateurDuTerritoire.dateValeurCible}
            unité={detailIndicateurDuTerritoire.unité}
            valeur={detailIndicateurDuTerritoire.valeurCible}
          />
        </td>
        <td className="fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition">
          {detailIndicateurDuTerritoire.proposition.statutTauxAvancement ===
          "EN_COURS" ? (
            <BarreDeProgressionAVenir variante={varianteBarreProgression} />
          ) : (
            <BarreDeProgression
              afficherTexte
              fond="gris-clair"
              positionTexte="dessus"
              taille="md"
              valeur={detailIndicateurDuTerritoire.proposition.tauxAvancement}
              variante={varianteBarreProgression}
            />
          )}
        </td>
      </tr>
      {children}
    </>
  );
};
