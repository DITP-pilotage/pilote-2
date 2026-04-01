import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { ComparaisonTerritoires } from "@/components/PageChantier/ComparaisonTerritoires/ComparaisonTerritoires";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionRepartitionGeographique = () => {
  const { chantier, mailleSelectionnee, mailleQuery, jalon, territoireCode } =
    pageChantier.useServerSidePropsContext();

  const estVisible =
    !!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] ||
    !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
    chantier.estTerritorialisé;

  if (!estVisible) {
    return null;
  }

  return (
    <div className="fr-my-2w">
      <BasePageChantierSection
        id="cartes"
        sectionClassName="print:break-inside-avoid"
        titre="Répartition géographique"
      >
        <ComparaisonTerritoires
          chantierId={chantier.id}
          jalon={jalon}
          maille={mailleQuery}
          territoireCode={territoireCode}
        />
      </BasePageChantierSection>
    </div>
  );
};
