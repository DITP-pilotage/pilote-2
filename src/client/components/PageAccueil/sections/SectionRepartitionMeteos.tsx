import Bloc from "@/components/_commons/Bloc/Bloc";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import RepartitionsMeteosChantiers from "@/components/PageAccueil/PageChantiers/FiltresMeteos/RepartitionsMeteosChantiers";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilSection } from "./BasePageAccueilSection";

export const SectionRepartitionMeteos = () => {
  const { repartitionMeteosChantiers } = usePageAccueilContext();

  return (
    <BasePageAccueilSection
      id="repartition-meteos"
      infobulle={INFOBULLE_CONTENUS.chantiers.météos}
      titre="Répartition des météos renseignées"
    >
      <Bloc contenuClassesSupplémentaires="fr-py-2w fr-px-3w">
        <RepartitionsMeteosChantiers
          repartitionMeteos={repartitionMeteosChantiers}
        />
      </Bloc>
    </BasePageAccueilSection>
  );
};
