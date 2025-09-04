import clsx from "clsx";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { formaterDate } from "@/client/utils/date/date";
import { estPropositionAccuseeReception } from "@/components/_commons/IndicateursChantier/Bloc/utils";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { ModalePropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancement/ModalePropositionValeurAvancement";
import { ModaleSuppressionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancement/ModaleSuppressionValeurAvancement";
import {
  ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT,
  ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT,
} from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const LignesPropositionValeurAvancement = ({
  estAutoriseAProposerUneValeurAvancement,
}: {
  estAutoriseAProposerUneValeurAvancement: boolean;
}) => {
  const détailTerritoireSélectionné = useTerritoireSelectionne();

  const { indicateur, detailIndicateurDuTerritoire, territoireCode, jalon } =
    useBlocIndicateurContext();

  if (detailIndicateurDuTerritoire.proposition === null) return null;

  const estPropositionSurLeBonJalon =
    detailIndicateurDuTerritoire.dateValeurAvancementMandat !== null
      ? new Date(
          detailIndicateurDuTerritoire.dateValeurAvancementMandat!,
        ).getFullYear() <= jalon
      : false;

  return (
    <>
      <tr
        className={clsx("ligne-modification-proposition-valeur-davancement", {
          "!bg-dsfr-info-950 !text-dsfr-info-main-525":
            estPropositionAccuseeReception(detailIndicateurDuTerritoire),
          "!bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679":
            !estPropositionAccuseeReception(detailIndicateurDuTerritoire),
        })}
        key={détailTerritoireSélectionné.nom}
      >
        <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm">
          <div className="flex align-center selecteur-infobulle-conteneur">
            <span className="texte-proposition font-bold">
              Proposition du territoire
            </span>
            <Infobulle
              classNameBouton="texte-proposition"
              classNameInfoBulle="tooltip-accordeon"
              idHtml={`infobulle-proposition-valeur-davancement-${détailTerritoireSélectionné.code}`}
              styleIconInfoBulle="informationProposition"
            >
              <p className="fr-text--sm texte-proposition">
                Valeur d'avancement proposée le{" "}
                {formaterDate(
                  detailIndicateurDuTerritoire.proposition.dateProposition,
                  "DD/MM/YYYY",
                )}{" "}
                par {detailIndicateurDuTerritoire.proposition.auteur}
              </p>
              <p className="fr-text--sm">
                <b>Motif de la proposition</b>
              </p>
              <p className="fr-text--sm">
                {detailIndicateurDuTerritoire.proposition.motif}
              </p>
              <p className="fr-text--sm">
                <b>Source des données et méthode de calcul</b>
              </p>
              <p className="fr-text--sm fr-mb-0">
                {
                  detailIndicateurDuTerritoire.proposition
                    .sourceDonneeEtMethodeCalcul
                }
              </p>
            </Infobulle>
          </div>
        </td>
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
                date={detailIndicateurDuTerritoire.dateValeurAvancementMandat}
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
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="dessus"
                taille="md"
                valeur={
                  detailIndicateurDuTerritoire.proposition
                    .tauxAvancementIntermediaire
                }
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
            date={detailIndicateurDuTerritoire.dateValeurAvancementMandat}
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
          <BarreDeProgression
            afficherTexte
            fond="gris-clair"
            positionTexte="dessus"
            taille="md"
            valeur={detailIndicateurDuTerritoire.proposition.tauxAvancement}
            variante="jaune-moutarde"
          />
        </td>
      </tr>
      <tr className="!bg-dsfr-moutarde-main-975 text-dsfr-moutarde-main-679 ligne-modification-proposition-valeur-davancement">
        {estAutoriseAProposerUneValeurAvancement ? (
          <td colSpan={8}>
            <div className="flex w-full justify-end">
              <button
                aria-controls={
                  ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + indicateur.id
                }
                className="fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-davancement fr-mr-1w"
                data-fr-opened="false"
                type="button"
              >
                Modifier la proposition
              </button>
              <button
                aria-controls={
                  ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT + indicateur.id
                }
                className="fr-btn fr-btn--icon-left fr-icon-delete-line fr-btn--secondary bouton-proposition-valeur-davancement"
                data-fr-opened="false"
                type="button"
              >
                Supprimer la proposition
              </button>
            </div>
            <ModalePropositionValeurAvancement
              detailIndicateur={detailIndicateurDuTerritoire}
              generatedHTMLID={
                ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + indicateur.id
              }
              indicateur={indicateur}
              territoireCode={territoireCode}
              territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
              territoireNom={détailTerritoireSélectionné.nom}
            />
            <ModaleSuppressionValeurAvancement
              generatedHTMLID={
                ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT + indicateur.id
              }
              indicateur={indicateur}
              territoireCode={territoireCode}
            />
          </td>
        ) : null}
      </tr>
    </>
  );
};
