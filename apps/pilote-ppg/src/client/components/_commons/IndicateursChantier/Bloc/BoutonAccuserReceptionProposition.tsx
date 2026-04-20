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
  const { indicateur, territoireCode } = useBlocIndicateurContext();

  return (
    <ModaleAccuserReceptionPropositionValeurAvancement
      detailIndicateur={detailIndicateur}
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
      territoireNom={détailTerritoireSélectionné.nom}
    >
      <BoutonSousLigné
        className="!text-dsfr-moutarde-main-679"
        iconLeft={<Icone className="text-current h-4 w-4" icone={Mail1Icon} />}
        type="button"
      >
        Accuser réception
      </BoutonSousLigné>
    </ModaleAccuserReceptionPropositionValeurAvancement>
  );
};
