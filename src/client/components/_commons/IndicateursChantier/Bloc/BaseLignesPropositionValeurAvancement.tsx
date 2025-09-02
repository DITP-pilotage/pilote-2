import { PropsWithChildren } from "react";
import clsx from "clsx";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { InformationsIndicateurs } from "@/components/_commons/IndicateursChantier/Bloc/InformationsIndicateurs";
import { DetailIndicateurPropositionValeurAvancement } from "@/server/chantiers/domain/DetailsIndicateurs";
import {
  estPropositionAcceptee,
  estPropositionAccepteeOuAccepteeAvecModification,
  estPropositionAccuseeReception,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { usePageChantierContext } from "@/components/PageChantier/usePageChantierContext";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";
import { CelluleStatutProposition } from "@/components/_commons/IndicateursChantier/Bloc/CelluleStatutProposition";

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

  const afficherPropositionAcceptee = doitAfficherPropositionAcceptee(
    detailIndicateur,
    datajobsExecution,
  );

  const estPropositionSurLeBonJalon =
    detailIndicateur.dateValeurAvancementMandat !== null
      ? new Date(detailIndicateur.dateValeurAvancementMandat!).getFullYear() <=
        jalon
      : false;

  const varianteBarreProgression =
    estPropositionAcceptee(detailIndicateur) ||
    estPropositionAccuseeReception(detailIndicateur)
      ? "bleu-dsfr-info"
      : "jaune-moutarde";
  return (
    <>
      <tr
        className={clsx("ligne-modification-proposition-valeur-davancement", {
          "!bg-dsfr-info-950 !text-dsfr-info-main-525":
            estPropositionAccuseeReception(detailIndicateur) ||
            afficherPropositionAcceptee,
          "!bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679":
            !estPropositionAccuseeReception(detailIndicateur) &&
            !estPropositionAccepteeOuAccepteeAvecModification(detailIndicateur),
        })}
        key={informationIndicateur.territoireNom}
      >
        <CelluleStatutProposition
          detailIndicateur={detailIndicateur}
          estAutoriseAAccepterLesPropositionsDeValeurAvancement={
            estAutoriseAAccepterLesPropositionsDeValeurAvancement
          }
          estAutoriseAProposerUneValeurAvancement={
            estAutoriseAProposerUneValeurAvancement
          }
          informationIndicateur={informationIndicateur}
          proposition={proposition}
        />
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
                variante={varianteBarreProgression}
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
            variante={varianteBarreProgression}
          />
        </td>
      </tr>
      {children}
    </>
  );
};
