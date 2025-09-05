import clsx from "clsx";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import {
  estPropositionAccuseeReception,
  estPropositionRefusee,
  estPropositionSupprimee,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import { BoutonSupprimerProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonSupprimerProposition";
import { BoutonModifierProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonModifierProposition";
import { BoutonPrendreDecisionProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonPrendreDecisionProposition";
import { BoutonAccuserReceptionProposition } from "@/components/_commons/IndicateursChantier/Bloc/BoutonAccuserReceptionProposition";
import {
  BaseLignesPropositionValeurAvancement,
  doitAfficherPropositionAcceptee,
} from "@/components/_commons/IndicateursChantier/Bloc/BaseLignesPropositionValeurAvancement";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";

export const LignesPropositionValeurAvancementV2 = ({
  propositionEstVisible,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
  estAutoriseAProposerUneValeurAvancement,
}: {
  propositionEstVisible: boolean;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  estAutoriseAProposerUneValeurAvancement: boolean;
}) => {
  const {
    datajobsExecution,
    detailIndicateurDuTerritoire,
    territoireCode,
    indicateur,
  } = useBlocIndicateurContext();

  const détailTerritoireSélectionné = useTerritoireSelectionne();

  if (
    !propositionEstVisible ||
    estPropositionSupprimee(detailIndicateurDuTerritoire) ||
    estPropositionRefusee(detailIndicateurDuTerritoire)
  ) {
    return null;
  }

  if (estAutoriseAAccepterLesPropositionsDeValeurAvancement) {
    return (
      <BaseLignesPropositionValeurAvancement
        estAutoriseAAccepterLesPropositionsDeValeurAvancement
        estAutoriseAProposerUneValeurAvancement={
          estAutoriseAProposerUneValeurAvancement
        }
      >
        {doitAfficherPropositionAcceptee(
          detailIndicateurDuTerritoire,
          datajobsExecution,
        ) ? null : (
          <tr
            className={clsx(
              "ligne-modification-proposition-valeur-davancement",
              {
                "!bg-dsfr-info-950 !text-dsfr-info-main-525":
                  estPropositionAccuseeReception(detailIndicateurDuTerritoire),
                "!bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679":
                  !estPropositionAccuseeReception(detailIndicateurDuTerritoire),
              },
            )}
          >
            <td colSpan={8}>
              <div className="flex w-full align-center justify-end gap-4">
                {!estPropositionAccuseeReception(
                  detailIndicateurDuTerritoire,
                ) && (
                  <div className="flex align-center">
                    <BoutonAccuserReceptionProposition
                      detailIndicateur={detailIndicateurDuTerritoire}
                      détailTerritoireSélectionné={détailTerritoireSélectionné}
                    />
                    <Infobulle classNameBouton="texte-jaune">
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
                  detailIndicateur={detailIndicateurDuTerritoire}
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
        estAutoriseAAccepterLesPropositionsDeValeurAvancement={
          estAutoriseAAccepterLesPropositionsDeValeurAvancement
        }
        estAutoriseAProposerUneValeurAvancement
      >
        {estPropositionAccuseeReception(detailIndicateurDuTerritoire) ||
        doitAfficherPropositionAcceptee(
          detailIndicateurDuTerritoire,
          datajobsExecution,
        ) ? null : (
          <tr className="ligne-modification-proposition-valeur-davancement !bg-dsfr-moutarde-main-975 !text-dsfr-moutarde-main-679">
            <td colSpan={8}>
              <div className="flex w-full justify-end">
                <BoutonModifierProposition />
                <BoutonSupprimerProposition
                  detailIndicateur={detailIndicateurDuTerritoire}
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
      estAutoriseAAccepterLesPropositionsDeValeurAvancement={
        estAutoriseAAccepterLesPropositionsDeValeurAvancement
      }
      estAutoriseAProposerUneValeurAvancement={
        estAutoriseAProposerUneValeurAvancement
      }
    />
  );
};
