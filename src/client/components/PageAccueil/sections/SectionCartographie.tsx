import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import CartographieAvancement from "@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement";
import useCartographie from "@/components/_commons/Cartographie/useCartographie";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionCartographie = () => {
  const {
    avancementsGlobauxTerritoriauxMoyens,
    territoireCode,
    mailleQuery,
    jalon,
  } = usePageAccueilContext();

  const pathname = "/accueil/chantier/[territoireCode]";
  const { auClicTerritoireCallback } = useCartographie(
    territoireCode,
    pathname,
  );

  return (
    <Bloc>
      <section id="cartographie">
        <Titre
          baliseHtml="h2"
          className="fr-text--lg break-keep fr-mb-0 fr-py-1v leading-6"
        >
          Taux d'avancement des chantiers par territoire
        </Titre>
        <CartographieAvancement
          auClicTerritoireCallback={auClicTerritoireCallback}
          données={avancementsGlobauxTerritoriauxMoyens}
          jalon={jalon}
          mailleSelectionnee={mailleQuery}
          pathname={pathname}
          territoireCode={territoireCode}
          élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
        />
      </section>
    </Bloc>
  );
};
