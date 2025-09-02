import clsx from "clsx";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { InformationsIndicateurs } from "@/components/_commons/IndicateursChantier/Bloc/InformationsIndicateurs";
import { DetailIndicateurPropositionValeurAvancement } from "@/server/chantiers/domain/DetailsIndicateurs";
import { usePageChantierContext } from "@/components/PageChantier/usePageChantierContext";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";
import { estPropositionAccuseeReception } from "@/components/_commons/IndicateursChantier/Bloc/utils";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { BoutonSupprimerProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonSupprimerProposition";
import { BoutonModifierProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonModifierProposition";
import { BoutonPrendreDecisionProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonPrendreDecisionProposition";
import { BoutonAccuserReceptionProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonAccuserReceptionProposition";
import {
  BaseLignesPropositionValeurAvancement,
  doitAfficherPropositionAcceptee,
} from "@/components/_commons/IndicateursChantier/Bloc/BaseLignesPropositionValeurAvancement";

export const LignesPropositionValeurAvancementV2 = ({
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
  const { datajobsExecution } = usePageChantierContext();
  // TODO: /!\ actionsTerritoiresStore est un hook
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  if (!propositionEstVisible) {
    return null;
  }

  const détailTerritoireSélectionné =
    récupérerDétailsSurUnTerritoire(territoireCode);

  if (estAutoriseAAccepterLesPropositionsDeValeurAvancement) {
    return (
      <BaseLignesPropositionValeurAvancement
        detailIndicateur={detailIndicateur}
        estAutoriseAAccepterLesPropositionsDeValeurAvancement
        estAutoriseAProposerUneValeurAvancement={
          estAutoriseAProposerUneValeurAvancement
        }
        informationIndicateur={informationIndicateur}
        jalon={jalon}
        proposition={proposition}
      >
        {doitAfficherPropositionAcceptee(
          detailIndicateur,
          datajobsExecution,
        ) ? null : (
          <tr
            className={clsx(
              "ligne-modification-proposition-valeur-davancement",
              {
                "!bg-dsfr-info-950 !text-dsfr-info-main-525":
                  estPropositionAccuseeReception(detailIndicateur),
                "!bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679":
                  !estPropositionAccuseeReception(detailIndicateur),
              },
            )}
          >
            <td colSpan={8}>
              <div className="flex w-full align-center justify-end gap-4">
                {!estPropositionAccuseeReception(detailIndicateur) && (
                  <div className="flex align-center">
                    <BoutonAccuserReceptionProposition
                      detailIndicateur={informationIndicateur.données}
                      détailTerritoireSélectionné={détailTerritoireSélectionné}
                      id={indicateur.id}
                      indicateur={indicateur}
                      territoireCode={territoireCode}
                    />
                    <Infobulle classNameBouton="texte-jaune" idHtml="test">
                      <p>
                        En accusant réception, vous informez le territoire que
                        vous avez pris connaissance de sa proposition. Il vous
                        est toujours possible, à tout moment, de prendre votre
                        décision (accepter, accepter avec modification ou
                        refuser) ou de réaliser un nouvel import de données.
                      </p>
                    </Infobulle>
                  </div>
                )}
                <BoutonPrendreDecisionProposition
                  detailIndicateur={informationIndicateur.données}
                  détailTerritoireSélectionné={détailTerritoireSélectionné}
                  id={indicateur.id}
                  indicateur={indicateur}
                  territoireCode={territoireCode}
                />
              </div>
            </td>
          </tr>
        )}
      </BaseLignesPropositionValeurAvancement>
    );
  }

  if (estAutoriseAProposerUneValeurAvancement) {
    return (
      <BaseLignesPropositionValeurAvancement
        detailIndicateur={detailIndicateur}
        estAutoriseAAccepterLesPropositionsDeValeurAvancement={
          estAutoriseAAccepterLesPropositionsDeValeurAvancement
        }
        estAutoriseAProposerUneValeurAvancement
        informationIndicateur={informationIndicateur}
        jalon={jalon}
        proposition={proposition}
      >
        {estPropositionAccuseeReception(detailIndicateur) ||
        doitAfficherPropositionAcceptee(
          detailIndicateur,
          datajobsExecution,
        ) ? null : (
          <tr className="ligne-modification-proposition-valeur-davancement !bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679">
            <td colSpan={8}>
              <div className="flex w-full justify-end">
                <BoutonModifierProposition
                  detailIndicateur={informationIndicateur.données}
                  détailTerritoireSélectionné={détailTerritoireSélectionné}
                  id={indicateur.id}
                  indicateur={indicateur}
                  territoireCode={territoireCode}
                />
                <BoutonSupprimerProposition
                  detailIndicateur={informationIndicateur.données}
                  détailTerritoireSélectionné={détailTerritoireSélectionné}
                  id={indicateur.id}
                  indicateur={indicateur}
                  territoireCode={territoireCode}
                />
              </div>
            </td>
          </tr>
        )}
      </BaseLignesPropositionValeurAvancement>
    );
  }

  return (
    <BaseLignesPropositionValeurAvancement
      detailIndicateur={detailIndicateur}
      estAutoriseAAccepterLesPropositionsDeValeurAvancement={
        estAutoriseAAccepterLesPropositionsDeValeurAvancement
      }
      estAutoriseAProposerUneValeurAvancement={
        estAutoriseAProposerUneValeurAvancement
      }
      informationIndicateur={informationIndicateur}
      jalon={jalon}
      proposition={proposition}
    />
  );
};
