import { PropsWithChildren } from "react";
import clsx from "clsx";
import { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";
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
import { Table } from "@/components/shared/Table";

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
      <Table.Row
        className={clsx("ligne-modification-proposition-valeur-davancement", {
          "bg-dsfr-grey-925 text-dsfr-grey-200": estChantierArchive,
          "bg-dsfr-info-950 text-dsfr-info-main-525":
            !estChantierArchive &&
            (estPropositionAccuseeReception(detailIndicateurDuTerritoire) ||
              afficherPropositionAcceptee),
          "bg-dsfr-moutarde-main-975 text-dsfr-moutarde-main-679":
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
        <Table.Cell className="mb-0 text-sm/6 text-center text-dsfr-grey-200 min-h-8 align-top p-0 md:p-0 md:py-2">
          <ValeurEtDate
            date={detailIndicateurDuTerritoire.dateValeurInitiale}
            unité={detailIndicateurDuTerritoire.unite}
            valeur={detailIndicateurDuTerritoire.valeurInitiale}
          />
        </Table.Cell>
        {estPropositionSurLeBonJalon ? (
          <>
            {/* Valeur d'avancement en fonction de la proposition du jalon et date valeur d'avancement en fonction du mandat */}
            <Table.Cell className="mb-0 text-sm/6 !text-current text-center min-h-8 align-top p-0 md:p-0 md:py-2">
              <ValeurEtDate
                date={
                  detailIndicateurDuTerritoire.proposition.dateValeurAvancement
                }
                unité={detailIndicateurDuTerritoire.unite}
                valeur={
                  detailIndicateurDuTerritoire.proposition.valeurAvancement
                }
              />
            </Table.Cell>
            <Table.Cell className="mb-0 text-sm/6 text-center text-dsfr-grey-200 min-h-8 align-top p-0 md:p-0 md:py-2">
              <ValeurEtDate
                date={detailIndicateurDuTerritoire.dateValeurCibleAnnuelle}
                unité={detailIndicateurDuTerritoire.unite}
                valeur={detailIndicateurDuTerritoire.valeurCibleAnnuelle}
              />
            </Table.Cell>
            <Table.Cell className="mb-0 text-sm/6 !text-current min-h-8 align-top p-0 px-4 md:p-0 md:py-2 md:px-4">
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
            </Table.Cell>
          </>
        ) : (
          <Table.Cell colSpan={3} />
        )}
      </Table.Row>
      {children}
    </>
  );
};
