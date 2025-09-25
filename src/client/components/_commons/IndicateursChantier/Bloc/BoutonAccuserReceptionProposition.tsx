import { useId } from "react";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModaleAccuserReceptionPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccuserReceptionPropositionValeurAvancement/ModaleAccuserReceptionPropositionValeurAvancement";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const BoutonAccuserReceptionProposition = ({
  detailIndicateur,
  détailTerritoireSélectionné,
}: {
  detailIndicateur: DétailsIndicateur;
  détailTerritoireSélectionné: DétailTerritoire;
}) => {
  const modaleId = useId();

  const { indicateur, territoireCode } = useBlocIndicateurContext();

  return (
    <>
      <BoutonSousLigné
        aria-controls={modaleId}
        className="fr-link--icon-left fr-icon-mail-line !text-dsfr-moutarde-main-679"
        dataFrOpened={false}
        type="button"
      >
        Accuser réception
      </BoutonSousLigné>
      <ModaleAccuserReceptionPropositionValeurAvancement
        detailIndicateur={detailIndicateur}
        generatedHTMLID={modaleId}
        indicateur={indicateur}
        territoireCode={territoireCode}
        territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
        territoireNom={détailTerritoireSélectionné.nom}
      />
    </>
  );
};
