import { useId } from "react";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModaleAccuserReceptionPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccuserReceptionPropositionValeurAvancement/ModaleAccuserReceptionPropositionValeurAvancement";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { Mail1Icon } from "@/components/_commons/Icones/Mail1Icon";
import { Icone } from "@/components/_commons/Icone";

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
        className="!text-dsfr-moutarde-main-679"
        dataFrOpened={false}
        iconLeft={<Icone className="text-current h-4 w-4" icone={Mail1Icon} />}
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
