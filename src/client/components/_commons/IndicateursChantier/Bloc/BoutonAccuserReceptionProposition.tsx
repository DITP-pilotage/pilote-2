import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { ModaleAccuserReceptionPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccuserReceptionPropositionValeurAvancement/ModaleAccuserReceptionPropositionValeurAvancement";

export const BoutonAccuserReceptionProposition = ({
  id,
  detailIndicateur,
  indicateur,
  territoireCode,
  détailTerritoireSélectionné,
}: {
  id: string;
  detailIndicateur: DétailsIndicateur;
  indicateur: Indicateur;
  territoireCode: string;
  détailTerritoireSélectionné: DétailTerritoire;
}) => (
  <>
    <BoutonSousLigné
      aria-controls={
        ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT + id
      }
      className="fr-link--icon-left fr-icon-mail-line texte-jaune"
      dataFrOpened={false}
      type="button"
    >
      Accuser réception
    </BoutonSousLigné>
    <ModaleAccuserReceptionPropositionValeurAvancement
      detailIndicateur={detailIndicateur}
      generatedHTMLID={
        ID_HTML_MODALE_ACCUSER_RECEPTION_PROPOSITION_VALEUR_DAVANCEMENT + id
      }
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
      territoireNom={détailTerritoireSélectionné.nom}
    />
  </>
);
