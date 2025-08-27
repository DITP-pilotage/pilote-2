import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { formaterDate } from "@/client/utils/date/date";
import { estPropositionAccuseeReception } from "@/components/_commons/IndicateursChantier/Bloc/utils";
import ValeurEtDate from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { ModalePropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancement/ModalePropositionValeurAvancement";
import { ModaleSuppressionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancement/ModaleSuppressionValeurAvancement";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModaleAccuserReceptionPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccuserReceptionPropositionValeurAvancement/ModaleAccuserReceptionPropositionValeurAvancement";
import { ModaleAccepterPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/ModaleAccepterPropositionValeurAvancement";
import { ModalePropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";
import { ModaleSuppressionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancementV2/ModaleSuppressionValeurAvancementV2";
import {
  ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT,
  ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT,
  ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT,
  ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT,
} from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { InformationsIndicateurs } from "@/components/_commons/IndicateursChantier/Bloc/InformationsIndicateurs";
import api from "@/server/infrastructure/api/trpc/api";
import { DetailIndicateurPropositionValeurAvancement } from "@/server/chantiers/domain/DetailsIndicateurs";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";

export const LignesPropositionValeurAvancement = ({
  indicateur,
  detailIndicateur,
  territoireCode,
  informationIndicateur,
  proposition,
  jalon,
  propositionEstVisible,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
  estAutoriseAProposerUneValeurAvancement,
}: {
  indicateur: Indicateur;
  jalon: number;
  territoireCode: string;
  detailIndicateur: DétailsIndicateur;
  informationIndicateur: InformationsIndicateurs[number];
  proposition: DetailIndicateurPropositionValeurAvancement;
  propositionEstVisible: boolean;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  estAutoriseAProposerUneValeurAvancement: boolean;
}) => {
  const { data: variableContenuFFPropositionValeurAvancementV2 } =
    api.gestionContenu.récupérerVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE_V2",
    });

  // TODO: /!\ actionsTerritoiresStore est un hook
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  if (
    !propositionEstVisible &&
    variableContenuFFPropositionValeurAvancementV2
  ) {
    return null;
  }

  const détailTerritoireSélectionné =
    récupérerDétailsSurUnTerritoire(territoireCode);
  const estPropositionSurLeBonJalon =
    detailIndicateur.dateValeurAvancementMandat !== null
      ? new Date(detailIndicateur.dateValeurAvancementMandat!).getFullYear() <=
        jalon
      : false;

  return (
    <>
      <tr
        className="ligne-modification-proposition-valeur-davancement"
        key={informationIndicateur.territoireNom}
      >
        <td className="fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm">
          <div className="flex align-center selecteur-infobulle-conteneur">
            <span className="texte-proposition">
              {variableContenuFFPropositionValeurAvancementV2
                ? "Proposition en cours"
                : "Proposition du territoire"}
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
          {variableContenuFFPropositionValeurAvancementV2 ? (
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
          ) : null}
        </td>
        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
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
            <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
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
        <td className="fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center">
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
      {!variableContenuFFPropositionValeurAvancementV2 ? (
        <tr className="ligne-modification-proposition-valeur-davancement">
          {estAutoriseAProposerUneValeurAvancement ? (
            <td colSpan={8}>
              <div className="flex w-full justify-end">
                <button
                  aria-controls={
                    ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT +
                    indicateur.id
                  }
                  className="fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-davancement fr-mr-1w"
                  data-fr-opened="false"
                  type="button"
                >
                  Modifier la proposition
                </button>
                <button
                  aria-controls={
                    ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT +
                    indicateur.id
                  }
                  className="fr-btn fr-btn--icon-left fr-icon-delete-line fr-btn--secondary bouton-proposition-valeur-davancement"
                  data-fr-opened="false"
                  type="button"
                >
                  Supprimer la proposition
                </button>
              </div>
              <ModalePropositionValeurAvancement
                detailIndicateur={informationIndicateur.données}
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
      ) : propositionEstVisible &&
        estAutoriseAAccepterLesPropositionsDeValeurAvancement ? (
        <tr className="ligne-modification-proposition-valeur-davancement">
          <td colSpan={8}>
            <div className="flex w-full align-center justify-end gap-4">
              {!estPropositionAccuseeReception(detailIndicateur) && (
                <div className="flex align-center">
                  <BoutonSousLigné
                    aria-controls={
                      ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT +
                      indicateur.id
                    }
                    className="fr-link--icon-left fr-icon-mail-line texte-jaune"
                    dataFrOpened={false}
                    type="button"
                  >
                    Accuser réception
                  </BoutonSousLigné>
                  <Infobulle classNameBouton="texte-jaune" idHtml="test">
                    <p>
                      En accusant réception, vous informez le territoire que
                      vous avez pris connaissance de sa proposition. Il vous est
                      toujours possible, à tout moment, de prendre votre
                      décision (accepter, accepter avec modification ou refuser)
                      ou de réaliser un nouvel import de données.
                    </p>
                  </Infobulle>
                </div>
              )}
              <button
                aria-controls={
                  ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT +
                  indicateur.id
                }
                className="fr-btn fr-btn--icon-left fr-icon-scales-3-fill fr-btn--secondary bouton-proposition-valeur-davancement"
                data-fr-opened="false"
                type="button"
              >
                Prendre une décision
              </button>
              <ModaleAccuserReceptionPropositionValeurAvancement
                detailIndicateur={informationIndicateur.données}
                generatedHTMLID={
                  ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT +
                  indicateur.id
                }
                indicateur={indicateur}
                territoireCode={territoireCode}
                territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
                territoireNom={détailTerritoireSélectionné.nom}
              />
              <ModaleAccepterPropositionValeurAvancement
                detailIndicateur={informationIndicateur.données}
                generatedHTMLID={
                  ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT +
                  indicateur.id
                }
                indicateur={indicateur}
                territoireCode={territoireCode}
                territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
                territoireNom={détailTerritoireSélectionné.nom}
              />
            </div>
          </td>
        </tr>
      ) : propositionEstVisible &&
        !estPropositionAccuseeReception(detailIndicateur) &&
        estAutoriseAProposerUneValeurAvancement ? (
        <tr className="ligne-modification-proposition-valeur-davancement">
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
            <ModalePropositionValeurAvancementV2
              detailIndicateur={informationIndicateur.données}
              generatedHTMLID={
                ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + indicateur.id
              }
              indicateur={indicateur}
              territoireCode={territoireCode}
              territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
              territoireNom={détailTerritoireSélectionné.nom}
            />
            <ModaleSuppressionValeurAvancementV2
              detailIndicateur={informationIndicateur.données}
              generatedHTMLID={
                ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT + indicateur.id
              }
              indicateur={indicateur}
              territoireCode={territoireCode}
              territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
              territoireNom={détailTerritoireSélectionné.nom}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
};
